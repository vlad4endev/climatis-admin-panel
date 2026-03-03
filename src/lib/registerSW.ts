export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[SW] Registered, scope:', reg.scope);

        // Auto-update check every 30 min
        setInterval(() => {
          reg.update().catch(() => {
            // Ignore "newestWorker is null" and other SW update errors
          });
        }, 30 * 60 * 1000);
      })
      .catch((err) => {
        console.warn('[SW] Registration failed:', err);
      });
  });
}
