import React from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import {
  UtensilsCrossed,
  ChefHat,
  LayoutGrid,
  BookOpen,
  User,
  Volume2,
  VolumeX,
  Zap,
  RotateCcw,
  Clock,
  TrendingUp,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activeScreen,
    setActiveScreen,
    soundMuted,
    setSoundMuted,
    activeWaiter,
    waiters,
    setActiveWaiterId,
    kitchenTickets,
    tables,
    triggerQuickDemoOrder,
    resetToDemoData,
  } = useRestaurant();

  // Count active pending or preparing kitchen tickets
  const activeKitchenCount = kitchenTickets.filter(
    (t) => t.status === 'enviado' || t.status === 'en_preparacion'
  ).length;

  const readyToServeCount = kitchenTickets.filter((t) => t.status === 'listo').length;

  const occupiedTablesCount = tables.filter((t) => t.status !== 'disponible').length;

  return (
    <header className="sticky top-0 z-40 bg-stone-900 border-b border-stone-800 text-stone-100 shadow-lg">
      {/* Top Banner / Brand & Fast Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-950/40 text-stone-950">
            <UtensilsCrossed className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">ComandaRCM</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
                VIVO
              </span>
            </div>
            <p className="text-xs text-stone-400 hidden sm:block">
              Terminal Ágil de Meseros & Cocina KDS
            </p>
          </div>
        </div>

        {/* Center / Fast badges */}
        <div className="hidden md:flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-800/80 border border-stone-700/60 text-stone-300">
            <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Mesas: <strong className="text-white">{occupiedTablesCount}/{tables.length}</strong> ocupadas
            </span>
          </div>

          <div
            onClick={() => setActiveScreen('kitchen')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border cursor-pointer transition-all ${
              readyToServeCount > 0
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 animate-pulse'
                : activeKitchenCount > 0
                ? 'bg-amber-950/50 border-amber-600/60 text-amber-300'
                : 'bg-stone-800/80 border-stone-700/60 text-stone-400'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5 text-orange-400" />
            <span>
              Cocina: <strong className="text-white">{activeKitchenCount}</strong> en marcha
              {readyToServeCount > 0 && ` • 🔔 ${readyToServeCount} listos`}
            </span>
          </div>
        </div>

        {/* Right actions: Waiter switcher, sound toggle, test order */}
        <div className="flex items-center gap-2">
          {/* Quick Demo Button */}
          <button
            onClick={triggerQuickDemoOrder}
            title="Cargar comanda de prueba para probar de inmediato"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium transition"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Probar Orden</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundMuted((prev) => !prev)}
            title={soundMuted ? 'Activar campana y sonidos' : 'Silenciar sonidos'}
            className={`p-2 rounded-lg border transition ${
              soundMuted
                ? 'bg-stone-800 border-stone-700 text-stone-500'
                : 'bg-stone-800/80 border-stone-700 text-amber-400 hover:bg-stone-700'
            }`}
          >
            {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Active Waiter Badge / Quick Switcher */}
          <div className="relative group">
            <button
              onClick={() => setActiveScreen('profile')}
              className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl bg-stone-800 hover:bg-stone-750 border border-stone-700 transition"
              title="Clic para ver o editar tu perfil de mesero"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-sm shadow-inner">
                {activeWaiter.avatar || '👨‍🍳'}
              </div>
              <div className="text-left hidden lg:block leading-tight">
                <div className="text-xs font-semibold text-white truncate max-w-[110px]">
                  {activeWaiter.nickname || activeWaiter.name}
                </div>
                <div className="text-[10px] text-stone-400">
                  {activeWaiter.shift.split(' ')[0]}
                </div>
              </div>
            </button>

            {/* Quick dropdown for switching waiters */}
            <div className="absolute right-0 mt-1 w-48 py-2 bg-stone-850 rounded-xl border border-stone-700 shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50">
              <div className="px-3 py-1 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                Cambiar de Mesero
              </div>
              {waiters.map((w) => (
                <button
                  key={w.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveWaiterId(w.id);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2.5 text-xs transition ${
                    w.id === activeWaiter.id
                      ? 'bg-amber-500/15 text-amber-300 font-semibold'
                      : 'text-stone-300 hover:bg-stone-750'
                  }`}
                >
                  <span className="text-base">{w.avatar}</span>
                  <div className="truncate">
                    <div>{w.name}</div>
                    <div className="text-[10px] text-stone-400">{w.shift.split(' ')[0]}</div>
                  </div>
                </button>
              ))}
              <div className="border-t border-stone-750 my-1 pt-1 px-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resetToDemoData();
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-[11px] text-stone-400 hover:text-stone-200 hover:bg-stone-750 rounded transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reiniciar datos demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="border-t border-stone-800/80 bg-stone-925 px-4 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 py-1.5">
          {/* Comanda Button */}
          <button
            onClick={() => setActiveScreen('waiter')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeScreen === 'waiter'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Comanda Móvil</span>
          </button>

          {/* KDS Kitchen */}
          <button
            onClick={() => setActiveScreen('kitchen')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap relative ${
              activeScreen === 'kitchen'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>Cocina & Bar (KDS)</span>
            {activeKitchenCount > 0 && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeScreen === 'kitchen'
                    ? 'bg-stone-900 text-amber-400'
                    : 'bg-orange-500 text-white animate-pulse'
                }`}
              >
                {activeKitchenCount}
              </span>
            )}
          </button>

          {/* Mesas */}
          <button
            onClick={() => setActiveScreen('tables')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeScreen === 'tables'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Mesas & Cuentas</span>
          </button>

          {/* Ventas Diarias Dashboard */}
          <button
            onClick={() => setActiveScreen('sales')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeScreen === 'sales'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Ventas Diarias (MXN)</span>
          </button>

          {/* Carta & Productos */}
          <button
            onClick={() => setActiveScreen('menu')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeScreen === 'menu'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Carta / Productos</span>
          </button>

          {/* Perfil */}
          <button
            onClick={() => setActiveScreen('profile')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeScreen === 'profile'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Mi Perfil ({activeWaiter.nickname || 'Mesero'})</span>
          </button>
        </div>
      </nav>
    </header>
  );
};
