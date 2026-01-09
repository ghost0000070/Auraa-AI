/**
 * Service Worker registration for PWA support
 */

export function registerServiceWorker(): void {
  if (
    'serviceWorker' in navigator && 
    import.meta.env.PROD &&
    (window.location.protocol === 'https:' || window.location.hostname === 'localhost')
  ) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
        })
        .catch((error) => {
          console.error('[SW] Service Worker registration failed:', error);
        });
    });
  }
}
