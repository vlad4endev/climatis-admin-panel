import { useSyncExternalStore, useEffect, useState, useCallback } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

/** Returns true when the browser has network connectivity. */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}

export type ConnectionQuality = "good" | "slow" | "offline";

/** Returns connection quality: 'good', 'slow', or 'offline'. */
export function useConnectionQuality(): ConnectionQuality {
  const isOnline = useOnlineStatus();
  const [quality, setQuality] = useState<ConnectionQuality>(isOnline ? "good" : "offline");

  const checkConnection = useCallback(async () => {
    if (!navigator.onLine) {
      setQuality("offline");
      return;
    }

    // Use Network Information API if available
    const nav = navigator as any;
    if (nav.connection) {
      const conn = nav.connection;
      const effectiveType = conn.effectiveType; // '4g', '3g', '2g', 'slow-2g'
      const downlink = conn.downlink; // Mbps

      if (effectiveType === "slow-2g" || effectiveType === "2g" || downlink < 0.5) {
        setQuality("slow");
        return;
      }
      if (effectiveType === "3g" || downlink < 1.5) {
        setQuality("slow");
        return;
      }
    }

    // Fallback: measure latency with a tiny fetch
    try {
      const start = performance.now();
      await fetch("/favicon.ico", { method: "HEAD", cache: "no-store" });
      const latency = performance.now() - start;
      setQuality(latency > 3000 ? "slow" : "good");
    } catch {
      setQuality("slow");
    }
  }, []);

  useEffect(() => {
    if (!isOnline) {
      setQuality("offline");
      return;
    }

    checkConnection();
    const interval = setInterval(checkConnection, 30000);

    const nav = navigator as any;
    const conn = nav.connection;
    if (conn) {
      conn.addEventListener("change", checkConnection);
    }

    return () => {
      clearInterval(interval);
      if (conn) {
        conn.removeEventListener("change", checkConnection);
      }
    };
  }, [isOnline, checkConnection]);

  return quality;
}
