import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

console.log("Hello from reCAPTCHA Edge Function!");

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method Not Allowed" }), {
      headers: { "Content-Type": "application/json" },
      status: 405,
    });
  }

  try {
    const { recaptchaToken } = await req.json();

    if (!recaptchaToken) {
      return new Response(JSON.stringify({ success: false, error: "No reCAPTCHA token provided" }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    const SECRET_KEY = Deno.env.get("RECAPTCHA_SECRET_KEY");

    if (!SECRET_KEY) {
      console.error("RECAPTCHA_SECRET_KEY environment variable not set.");
      return new Response(JSON.stringify({ success: false, error: "Server configuration error" }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }

    const verificationUrl = "https://www.google.com/recaptcha/api/siteverify";
    const params = new URLSearchParams();
    params.append("secret", SECRET_KEY);
    params.append("response", recaptchaToken);
    // Optional: Append remoteip for better verification (requires fetching from request headers)
    // params.append("remoteip", req.headers.get("x-forwarded-for") || "");

    const recaptchaResponse = await fetch(verificationUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await recaptchaResponse.json();

    if (data.success) {
      // reCAPTCHA verification successful. You can also check data.score for v3.
      console.log("reCAPTCHA verification successful:", data);
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      console.error("reCAPTCHA verification failed:", data["error-codes"]);
      return new Response(JSON.stringify({ success: false, error: data["error-codes"] || "reCAPTCHA verification failed" }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }
  } catch (error) {
    console.error("Error in reCAPTCHA Edge Function:", error.message);
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
