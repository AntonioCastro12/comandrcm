import React from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { Bell, CheckCircle2, Info, X } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { notifications, dismissNotification, setActiveScreen } = useRestaurant();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-2 sm:px-0">
      {notifications.map((n) => {
        const isReady = n.type === 'kitchen_ready';
        const isSent = n.type === 'order_sent';

        return (
          <div
            key={n.id}
            className={`pointer-events-auto p-3.5 rounded-2xl shadow-2xl border backdrop-blur-md flex items-start gap-3 transition-all transform animate-in slide-in-from-bottom-3 duration-200 ${
              isReady
                ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-100 ring-2 ring-emerald-500/30'
                : isSent
                ? 'bg-amber-950/95 border-amber-500/50 text-amber-100 ring-2 ring-amber-500/30'
                : 'bg-stone-900/95 border-stone-700 text-stone-200'
            }`}
          >
            <div
              className={`p-2 rounded-xl flex-shrink-0 ${
                isReady
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : isSent
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-stone-800 text-stone-300'
              }`}
            >
              {isReady ? (
                <Bell className="w-5 h-5 animate-bounce" />
              ) : isSent ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Info className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold leading-tight flex items-center justify-between">
                <span>{n.title}</span>
                <span className="text-[10px] opacity-60 font-normal">Ahora</span>
              </div>
              <p className="text-xs mt-0.5 leading-snug opacity-90">{n.message}</p>

              {isReady && (
                <button
                  onClick={() => setActiveScreen('kitchen')}
                  className="mt-2 text-[11px] font-semibold text-emerald-300 hover:text-emerald-100 underline block"
                >
                  Ver en Cocina KDS →
                </button>
              )}
            </div>

            <button
              onClick={() => dismissNotification(n.id)}
              className="text-stone-400 hover:text-stone-200 p-1 rounded-lg hover:bg-black/20"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
