// Envelope encryption utilities: RSA-OAEP (public key) + AES-GCM symmetric key.
// The backend stores only ciphertext; private key lives server-side (edge function or secure worker).
// Public key is fetched via edge function `integration-public-key` returning PEM.

const TEXT_ENCODER = new TextEncoder();
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export interface EncryptedEnvelope {
  version: 1;
  algo: 'RSA-OAEP+AES-GCM';
  key: string;        // base64 of RSA-encrypted raw AES key
  iv: string;         // base64 IV
  cipher: string;     // base64 ciphertext
  tag?: string;       // (AES-GCM tag is appended automatically in WebCrypto cipher output, kept for forward compat)
}

function base64(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function fromBase64(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i=0;i<binary.length;i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function importRsaPublicKey(pem: string): Promise<CryptoKey> {
  const clean = pem.replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s+/g, '');
  const der = fromBase64(clean);
  return crypto.subtle.importKey(
    'spki',
    der,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );
}

let __integrationPublicKey: string | null = null;
export async function fetchIntegrationPublicKey(): Promise<string> {
  if (__integrationPublicKey) return __integrationPublicKey;
  const fallback = (import.meta as { env?: { VITE_INTEGRATION_RSA_PUBLIC_KEY?: string } })?.env?.VITE_INTEGRATION_RSA_PUBLIC_KEY;
  try {
    const functionUrl = `${SUPABASE_URL}/functions/v1/integration-public-key`;
    const res = await fetch(functionUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.publicKey) {
        __integrationPublicKey = data.publicKey;
        return data.publicKey;
      }
    }
  } catch (e) {
    console.warn('Failed to fetch integration public key:', e);
    if (!fallback) throw new Error('Failed to fetch integration public key and no fallback provided');
  }
  if (fallback) {
    __integrationPublicKey = fallback;
    return fallback;
  }
  throw new Error('Integration public key unavailable');
}

export async function encryptCredential(plaintext: string): Promise<EncryptedEnvelope> {
  const pem = await fetchIntegrationPublicKey();
  const rsaKey = await importRsaPublicKey(pem);
  const aesKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt','decrypt']);
  const rawAes = await crypto.subtle.exportKey('raw', aesKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, TEXT_ENCODER.encode(plaintext));
  const encKeyBuf = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, rsaKey, rawAes);
  return {
    version: 1,
    algo: 'RSA-OAEP+AES-GCM',
    key: base64(encKeyBuf),
    iv: base64(iv.buffer),
    cipher: base64(cipherBuf)
  };
}

// Decryption is intentionally omitted client-side (private key not available). Provided only for legacy fallback.
export async function decryptLegacyBase64(cipher: string): Promise<string> {
  try { return decodeURIComponent(escape(atob(cipher))); } catch { return ''; }
}
