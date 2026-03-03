import { useConnectionQuality, ConnectionQuality } from "@/hooks/useOnlineStatus";
import { WifiOff, Wifi, X } from "lucide-react";
import { useState, useEffect } from "react";

const BANNER_CONFIG: Record<Exclude<ConnectionQuality, "good">, {
  icon: typeof WifiOff;
  bg: string;
  text: string;
  message: string;
  detail: string;
}> = {
  offline: {
    icon: WifiOff,
    bg: "bg-destructive",
    text: "text-destructive-foreground",
    message: "Нет подключения к интернету",
    detail: "Данные не могут быть сохранены. Изменения отправятся автоматически при восстановлении связи.",
  },
  slow: {
    icon: Wifi,
    bg: "bg-amber-500",
    text: "text-white",
    message: "Медленное соединение",
    detail: "Загрузка данных и сохранение могут занимать больше времени. Пожалуйста, дождитесь завершения операций.",
  },
};

export function OfflineBanner() {
  const quality = useConnectionQuality();
  const [dismissed, setDismissed] = useState(false);
  const [wasOnline, setWasOnline] = useState(true);
  const [showRestored, setShowRestored] = useState(false);

  // Reset dismiss when quality changes
  useEffect(() => {
    if (quality === "offline") {
      setDismissed(false);
      setWasOnline(false);
    } else if (!wasOnline && quality === "good") {
      setShowRestored(true);
      setWasOnline(true);
      const timer = setTimeout(() => setShowRestored(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [quality, wasOnline]);

  // Show "connection restored" toast
  if (showRestored) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-emerald-500 text-white text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 shadow-lg animate-in slide-in-from-top duration-300">
        <Wifi className="h-4 w-4" />
        Соединение восстановлено
      </div>
    );
  }

  if (quality === "good" || dismissed) return null;

  const config = BANNER_CONFIG[quality];
  const Icon = config.icon;

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] ${config.bg} ${config.text} py-2 px-4 text-sm font-medium shadow-lg animate-in slide-in-from-top duration-300`}>
      <div className="flex items-center justify-center gap-2 max-w-3xl mx-auto">
        <Icon className="h-4 w-4 flex-shrink-0 animate-pulse" />
        <div className="text-center">
          <span className="font-semibold">{config.message}.</span>{" "}
          <span className="opacity-90">{config.detail}</span>
        </div>
        {quality === "slow" && (
          <button
            onClick={() => setDismissed(true)}
            className="ml-2 p-0.5 rounded hover:bg-white/20 transition-colors flex-shrink-0"
            aria-label="Закрыть"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
