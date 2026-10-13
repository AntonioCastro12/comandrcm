import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { KitchenTicket, TicketStatus } from '../types/restaurant';
import { downloadComandaPDF } from '../utils/pdfTicketGenerator';
import {
  ChefHat,
  Flame,
  Wine,
  Clock,
  CheckCircle2,
  Bell,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Filter,
  FileText,
} from 'lucide-react';

export const KitchenDisplayScreen: React.FC = () => {
  const {
    kitchenTickets,
    updateTicketStatus,
    toggleTicketItemCompleted,
    triggerQuickDemoOrder,
  } = useRestaurant();

  const handleDownloadTicketPDF = (ticket: KitchenTicket) => {
    const subtotal = ticket.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    downloadComandaPDF({
      orderNumber: ticket.orderNumber,
      tableName: ticket.tableName,
      tableNumber: ticket.tableNumber,
      waiterName: ticket.waiterName,
      items: ticket.items.map((i) => ({
        id: i.id,
        name: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        destination: i.destination,
        notes: i.notes,
      })),
      subtotal,
      dateStr: new Date(ticket.createdAt).toLocaleString('es-MX', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
    });
  };

  const [activeTab, setActiveTab] = useState<'activos' | 'cocina' | 'bar' | 'listos' | 'completados'>('activos');
  // Timer tick for live elapsed time updates
  const [, setTimerTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimerTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatElapsed = (createdAt: number) => {
    const elapsedSec = Math.floor((Date.now() - createdAt) / 1000);
    const mins = Math.floor(elapsedSec / 60);
    const secs = elapsedSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} min`;
  };

  const isUrgent = (createdAt: number) => {
    return (Date.now() - createdAt) > 1000 * 60 * 15; // > 15 mins
  };

  const isWarning = (createdAt: number) => {
    return (Date.now() - createdAt) > 1000 * 60 * 8; // > 8 mins
  };

  // Filtered tickets
  const filteredTickets = kitchenTickets.filter((ticket) => {
    if (activeTab === 'completados') {
      return ticket.status === 'entregado';
    }
    if (activeTab === 'listos') {
      return ticket.status === 'listo';
    }
    if (activeTab === 'cocina') {
      return (
        (ticket.destination === 'cocina' || ticket.destination === 'mixto') &&
        ticket.status !== 'entregado'
      );
    }
    if (activeTab === 'bar') {
      return (
        (ticket.destination === 'bar' || ticket.destination === 'mixto') &&
        ticket.status !== 'entregado'
      );
    }
    // 'activos'
    return ticket.status !== 'entregado';
  });

  const activeCount = kitchenTickets.filter((t) => t.status !== 'entregado').length;
  const readyCount = kitchenTickets.filter((t) => t.status === 'listo').length;
  const inPrepCount = kitchenTickets.filter((t) => t.status === 'en_preparacion').length;
  const newOrdersCount = kitchenTickets.filter((t) => t.status === 'enviado').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4">
      {/* Header del KDS */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center text-stone-950 shadow-md">
            <ChefHat className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Pantalla de Cocina & Bar (KDS)</h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Sincronización en Vivo
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Despacho en tiempo real de comandas enviadas por los meseros
            </p>
          </div>
        </div>

        {/* Quick KDS Counters */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-blue-950/40 border border-blue-600/40 text-blue-300 text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span>Nuevas: <strong>{newOrdersCount}</strong></span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-600/40 text-amber-300 text-xs flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Cocinando: <strong>{inPrepCount}</strong></span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-emerald-400" />
            <span>Listas para servir: <strong>{readyCount}</strong></span>
          </div>
        </div>
      </div>

      {/* Tabs de Filtro */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('activos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'activos'
                ? 'bg-amber-500 text-stone-950 shadow'
                : 'bg-stone-850 text-stone-300 hover:bg-stone-800'
            }`}
          >
            Todas las Activas ({activeCount})
          </button>

          <button
            onClick={() => setActiveTab('cocina')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'cocina'
                ? 'bg-orange-500 text-stone-950 shadow'
                : 'bg-stone-850 text-stone-300 hover:bg-stone-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Solo Cocina</span>
          </button>

          <button
            onClick={() => setActiveTab('bar')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'bar'
                ? 'bg-blue-500 text-stone-950 shadow'
                : 'bg-stone-850 text-stone-300 hover:bg-stone-800'
            }`}
          >
            <Wine className="w-3.5 h-3.5" />
            <span>Solo Bar</span>
          </button>

          <button
            onClick={() => setActiveTab('listos')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'listos'
                ? 'bg-emerald-500 text-stone-950 shadow'
                : 'bg-stone-850 text-stone-300 hover:bg-stone-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Listos para Servir ({readyCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('completados')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'completados'
                ? 'bg-stone-700 text-white'
                : 'bg-stone-850 text-stone-400 hover:bg-stone-800'
            }`}
          >
            Historial Despachado
          </button>
        </div>

        {activeCount === 0 && (
          <button
            onClick={triggerQuickDemoOrder}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generar comanda para probar
          </button>
        )}
      </div>

      {/* Grid de Tickets de Cocina (KDS Cards) */}
      {filteredTickets.length === 0 ? (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-12 text-center text-stone-400">
          <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-400" />
          <h3 className="text-base font-bold text-stone-200">
            {activeTab === 'completados'
              ? 'No hay comandas archivadas todavía'
              : '¡Cocina limpia y al día!'}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
            {activeTab === 'completados'
              ? 'Las comandas completadas aparecerán aquí una vez despachadas.'
              : 'No hay pedidos pendientes en esta sección. En cuanto un mesero tome una comanda aparecerá al instante.'}
          </p>
          <button
            onClick={triggerQuickDemoOrder}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-stone-950 hover:bg-amber-400 transition"
          >
            Simular comanda de mesero
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTickets.map((ticket) => {
            const urgent = isUrgent(ticket.createdAt);
            const warning = isWarning(ticket.createdAt);
            const isReady = ticket.status === 'listo';
            const isInPrep = ticket.status === 'en_preparacion';
            const isNew = ticket.status === 'enviado';
            const isDelivered = ticket.status === 'entregado';

            return (
              <div
                key={ticket.id}
                className={`rounded-2xl border flex flex-col justify-between overflow-hidden shadow-xl transition-all ${
                  isReady
                    ? 'bg-emerald-950/30 border-emerald-500/70 ring-2 ring-emerald-500/30'
                    : urgent
                    ? 'bg-rose-950/30 border-rose-500/80 ring-2 ring-rose-500/30'
                    : warning
                    ? 'bg-amber-950/20 border-amber-500/60'
                    : 'bg-stone-900 border-stone-800'
                }`}
              >
                {/* Header del Ticket */}
                <div
                  className={`p-3.5 border-b flex items-start justify-between ${
                    isReady
                      ? 'bg-emerald-900/40 border-emerald-700/60'
                      : urgent
                      ? 'bg-rose-900/40 border-rose-700/60'
                      : warning
                      ? 'bg-amber-900/40 border-amber-700/60'
                      : 'bg-stone-850 border-stone-750'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base text-white">
                        {ticket.tableName}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md font-mono font-bold bg-black/40 text-amber-300">
                        #{ticket.orderNumber}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-300 mt-0.5 flex items-center gap-1">
                      <span>Mesero: <strong>{ticket.waiterName}</strong></span>
                      <span>•</span>
                      <span className="capitalize">{ticket.destination}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDownloadTicketPDF(ticket)}
                      className="p-1 rounded-lg bg-black/30 hover:bg-black/50 text-stone-300 hover:text-amber-300 border border-white/10 transition cursor-pointer"
                      title="Descargar o imprimir PDF de esta comanda"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>

                    {/* Cronómetro en tiempo real */}
                    <div
                      className={`px-2 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 ${
                        isReady
                          ? 'bg-emerald-500 text-stone-950'
                          : urgent
                          ? 'bg-rose-600 text-white animate-pulse'
                          : warning
                          ? 'bg-amber-500 text-stone-950'
                          : 'bg-stone-800 text-stone-300'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{formatElapsed(ticket.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Lista de Platillos / Tachar con Checkbox */}
                <div className="p-3.5 flex-1 space-y-2.5">
                  <div className="text-[11px] font-semibold text-stone-400 flex items-center justify-between">
                    <span>PLATILLOS ({ticket.items.reduce((s, i) => s + i.quantity, 0)})</span>
                    <span className="text-[10px]">Toca para tachar</span>
                  </div>

                  <div className="space-y-2">
                    {ticket.items.map((item) => {
                      const isItemDone = ticket.completedItemIds.includes(item.id);

                      return (
                        <div
                          key={item.id}
                          onClick={() =>
                            toggleTicketItemCompleted(ticket.tableId, ticket.id, item.id)
                          }
                          className={`p-2 rounded-xl border text-xs cursor-pointer select-none transition ${
                            isItemDone
                              ? 'bg-stone-950/60 border-stone-800 text-stone-500 line-through'
                              : 'bg-stone-850 border-stone-750 text-stone-100 hover:border-stone-600'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-4 h-4 rounded flex items-center justify-center border ${
                                  isItemDone
                                    ? 'bg-emerald-600 border-emerald-500 text-white'
                                    : 'border-stone-600 bg-stone-800'
                                }`}
                              >
                                {isItemDone && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span className="font-bold text-amber-400 text-sm">
                                {item.quantity}x
                              </span>
                              <span className="font-medium">{item.productName}</span>
                            </div>

                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                item.destination === 'bar'
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : 'bg-orange-500/20 text-orange-300'
                              }`}
                            >
                              {item.destination === 'bar' ? 'Bar' : 'Cocina'}
                            </span>
                          </div>

                          {/* Notas destacadas para el chef */}
                          {item.notes && (
                            <div className="mt-1.5 ml-6 px-2 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold text-[11px] not-italic">
                              ⚠️ NOTA: {item.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Barra de Acciones del Ticket para la Cocina */}
                <div className="p-3 bg-stone-850/80 border-t border-stone-800 space-y-1.5">
                  {isNew && (
                    <button
                      onClick={() =>
                        updateTicketStatus(ticket.tableId, ticket.id, 'en_preparacion')
                      }
                      className="w-full py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center justify-center gap-1.5 transition shadow"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>👨‍🍳 Empezar a Cocinar</span>
                    </button>
                  )}

                  {isInPrep && (
                    <button
                      onClick={() =>
                        updateTicketStatus(ticket.tableId, ticket.id, 'listo')
                      }
                      className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-stone-950 flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-950/40"
                    >
                      <Bell className="w-3.5 h-3.5 animate-bounce" />
                      <span>🔔 ¡LISTO PARA SERVIR!</span>
                    </button>
                  )}

                  {isReady && (
                    <div className="space-y-1">
                      <div className="text-center text-[11px] font-bold text-emerald-400 bg-emerald-950/60 py-1 rounded-lg border border-emerald-500/30">
                        🔔 Mesero notificado para recoger
                      </div>
                      <button
                        onClick={() =>
                          updateTicketStatus(ticket.tableId, ticket.id, 'entregado')
                        }
                        className="w-full py-2 rounded-xl font-semibold text-xs bg-stone-800 hover:bg-stone-750 text-stone-200 flex items-center justify-center gap-1.5 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Confirmar Entregado en Mesa</span>
                      </button>
                    </div>
                  )}

                  {isDelivered && (
                    <div className="flex items-center justify-between text-xs text-stone-400 px-1 py-1">
                      <span>Entregado con éxito</span>
                      <button
                        onClick={() =>
                          updateTicketStatus(ticket.tableId, ticket.id, 'en_preparacion')
                        }
                        className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Reabrir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
