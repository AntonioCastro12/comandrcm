import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { ProductCategory, Product } from '../types/restaurant';
import { formatMXN } from '../utils/currency';
import { QuickItemNotesModal } from './QuickItemNotesModal';
import { ComandaReportModal } from './ComandaReportModal';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Send,
  MessageSquare,
  Clock,
  Utensils,
  Wine,
  Flame,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Receipt,
  FileText,
  Sparkles,
} from 'lucide-react';

const CATEGORIES: { id: 'todos' | ProductCategory; label: string; icon: string }[] = [
  { id: 'todos', label: 'Todo el Menú', icon: '🍽️' },
  { id: 'entradas', label: 'Entradas', icon: '🥗' },
  { id: 'fuertes', label: 'Platos Fuertes', icon: '🥩' },
  { id: 'bebidas', label: 'Bebidas', icon: '🥤' },
  { id: 'cocteles', label: 'Coctelería', icon: '🍸' },
  { id: 'postres', label: 'Postres', icon: '🍰' },
];

export const WaiterOrderScreen: React.FC = () => {
  const {
    products,
    tables,
    selectedTableId,
    setSelectedTableId,
    selectedTable,
    currentCart,
    addToCart,
    updateCartItemQuantity,
    updateCartItemNotes,
    removeFromCart,
    clearCart,
    sendOrderToKitchen,
    activeWaiter,
    requestTableBill,
    setActiveScreen,
  } = useRestaurant();

  const [activeCategory, setActiveCategory] = useState<'todos' | ProductCategory>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [tipPercentage, setTipPercentage] = useState<number>(10);
  const [showPastOrders, setShowPastOrders] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Note Modal state
  const [noteModalItem, setNoteModalItem] = useState<{
    id: string;
    productName: string;
    currentNotes: string;
  } | null>(null);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = activeCategory === 'todos' || p.category === activeCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  // Calculations for current active cart
  const cartSubtotal = currentCart.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const cartTotalItems = currentCart.reduce((sum, item) => sum + item.quantity, 0);
  const tipAmount = (cartSubtotal * tipPercentage) / 100;
  const cartTotal = cartSubtotal + tipAmount;

  // Past tickets for the selected table
  const tablePastTickets = selectedTable?.tickets || [];
  const tablePastTotal = tablePastTickets.reduce((sum, ticket) => {
    return (
      sum +
      ticket.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0)
    );
  }, 0);

  // Quick lookup of how many of a product are currently in the active cart
  const getProductQuantityInCart = (productId: string) => {
    return currentCart
      .filter((i) => i.productId === productId)
      .reduce((sum, i) => sum + i.quantity, 0);
  };

  const handleSendOrder = () => {
    if (currentCart.length === 0) return;
    sendOrderToKitchen();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
      {/* 1. Bar de Selección de Mesas Rápidas */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-300">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            SELECCIONA LA MESA A ATENDER:
          </div>
          <button
            onClick={() => setActiveScreen('tables')}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            Ver Mapa Completo <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {tables.map((table) => {
            const isSelected = table.id === selectedTableId;
            const isOccupied = table.status === 'ocupada';
            const isBillRequested = table.status === 'cuenta_pedida';

            return (
              <button
                key={table.id}
                onClick={() => setSelectedTableId(table.id)}
                className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-amber-500 border-amber-400 text-stone-950 font-bold shadow-lg shadow-amber-500/20 scale-[1.02]'
                    : isBillRequested
                    ? 'bg-purple-950/60 border-purple-600/70 text-purple-200 hover:bg-purple-900/60'
                    : isOccupied
                    ? 'bg-stone-850 border-orange-500/50 text-stone-200 hover:bg-stone-800'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:bg-stone-850 hover:text-stone-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span>{table.name}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSelected
                        ? 'bg-stone-950'
                        : isBillRequested
                        ? 'bg-purple-400 animate-pulse'
                        : isOccupied
                        ? 'bg-orange-400'
                        : 'bg-emerald-500'
                    }`}
                  />
                </div>
                <div
                  className={`text-[10px] mt-0.5 ${
                    isSelected
                      ? 'text-stone-900'
                      : isBillRequested
                      ? 'text-purple-300'
                      : isOccupied
                      ? 'text-amber-400'
                      : 'text-stone-500'
                  }`}
                >
                  {isBillRequested
                    ? 'Pedir Cuenta'
                    : isOccupied
                    ? `${table.tickets.length} ronda(s)`
                    : 'Disponible'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Banner de Información de Mesa Seleccionada */}
      {selectedTable && (
        <div className="bg-stone-850 border border-stone-800 rounded-2xl p-3.5 mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center font-bold text-amber-400">
              #{selectedTable.number}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">{selectedTable.name}</h2>
                <span className="text-xs px-2 py-0.5 rounded-md bg-stone-800 text-stone-400">
                  {selectedTable.area}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                    selectedTable.status === 'cuenta_pedida'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : selectedTable.status === 'ocupada'
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {selectedTable.status === 'cuenta_pedida'
                    ? 'Cuenta Pedida'
                    : selectedTable.status === 'ocupada'
                    ? 'Mesa Ocupada'
                    : 'Mesa Disponible'}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Capacidad: {selectedTable.capacity} comensales • Mesero actual:{' '}
                <strong className="text-stone-200">
                  {selectedTable.currentWaiterName || activeWaiter.name}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {tablePastTickets.length > 0 && (
              <button
                onClick={() => setShowPastOrders(!showPastOrders)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition ${
                  showPastOrders
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-750'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {showPastOrders ? 'Ocultar' : 'Ver'} Comandas Anteriores (
                  {tablePastTickets.length})
                </span>
              </button>
            )}

            {/* Botón Reporte PDF de la Mesa (para comanda actual o acumulada) */}
            {(currentCart.length > 0 || tablePastTickets.length > 0) && (
              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                title="Generar y enviar reporte PDF de comanda por WhatsApp o Correo"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Reporte PDF</span>
              </button>
            )}

            {selectedTable.status === 'ocupada' && (
              <button
                onClick={() => requestTableBill(selectedTable.id)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 flex items-center gap-1.5 transition"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Pedir Cuenta</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Historial expandible de comandas de la mesa (si está abierto) */}
      {showPastOrders && selectedTable && tablePastTickets.length > 0 && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 mb-4 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Comandas Ya Enviadas a Cocina/Bar para {selectedTable.name}
            </h3>
            <span className="text-xs text-stone-400">
              Total acumulado consumido: <strong className="text-emerald-400">{formatMXN(tablePastTotal)}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tablePastTickets.map((ticket, idx) => (
              <div
                key={ticket.id}
                className="bg-stone-850 border border-stone-750 rounded-xl p-3 text-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-stone-750 mb-2">
                  <span className="font-semibold text-white">
                    Ronda #{idx + 1} (Comanda #{ticket.orderNumber})
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      ticket.status === 'listo'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : ticket.status === 'en_preparacion'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : ticket.status === 'entregado'
                        ? 'bg-stone-700 text-stone-300'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {ticket.status === 'listo'
                      ? '🔔 ¡Listo para servir!'
                      : ticket.status === 'en_preparacion'
                      ? '👨‍🍳 En Preparación'
                      : ticket.status === 'entregado'
                      ? '✅ Entregado'
                      : '⏳ Enviado a Cocina'}
                  </span>
                </div>

                <div className="space-y-1">
                  {ticket.items.map((it) => (
                    <div key={it.id} className="flex justify-between text-stone-300">
                      <span>
                        <strong className="text-amber-400">{it.quantity}x</strong> {it.productName}
                        {it.notes && (
                          <span className="text-[11px] text-amber-300/80 block pl-4 italic">
                            ↳ {it.notes}
                          </span>
                        )}
                      </span>
                      <span className="text-stone-400">
                        {formatMXN(it.quantity * it.unitPrice)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Layout Principal: Catálogo (Izquierda) + Comanda Actual / Bandeja (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Columna Izquierda: Menú y Platillos (7 columnas en desktop) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Barra de Búsqueda y Categorías */}
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar platillo, corte, coctel, postre..."
                className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-white"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Categorías */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                      isActive
                        ? 'bg-stone-100 text-stone-950 shadow'
                        : 'bg-stone-850 text-stone-300 hover:bg-stone-800 border border-stone-800'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid de Platillos */}
          {filteredProducts.length === 0 ? (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 text-center text-stone-400">
              <Utensils className="w-8 h-8 mx-auto mb-2 opacity-40 text-amber-400" />
              <p className="text-sm font-medium">No se encontraron productos en esta categoría.</p>
              <button
                onClick={() => {
                  setActiveCategory('todos');
                  setSearchQuery('');
                }}
                className="mt-3 text-xs text-amber-400 hover:underline"
              >
                Ver todo el menú
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredProducts.map((product) => {
                const inCartQty = getProductQuantityInCart(product.id);
                const isAvailable = product.available;

                return (
                  <div
                    key={product.id}
                    className={`bg-stone-900 border rounded-2xl p-3.5 flex flex-col justify-between transition-all group ${
                      !isAvailable
                        ? 'opacity-60 border-stone-850'
                        : inCartQty > 0
                        ? 'border-amber-500/60 bg-amber-950/10 shadow-md ring-1 ring-amber-500/30'
                        : 'border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                              product.destination === 'bar'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                            }`}
                          >
                            {product.destination === 'bar' ? (
                              <Wine className="w-2.5 h-2.5" />
                            ) : (
                              <Flame className="w-2.5 h-2.5" />
                            )}
                            {product.destination === 'bar' ? 'Bar' : 'Cocina'}
                          </span>

                          {product.badge && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/20">
                              {product.badge}
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-stone-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          ~{product.prepTimeMinutes}m
                        </span>
                      </div>

                      {/* Product Name & Description */}
                      <h4 className="font-semibold text-sm text-stone-100 group-hover:text-amber-300 transition">
                        {product.name}
                      </h4>
                      <p className="text-xs text-stone-400 line-clamp-2 mt-1 leading-snug">
                        {product.description}
                      </p>
                    </div>

                    {/* Footer: Price & Add Actions */}
                    <div className="mt-3 pt-2.5 border-t border-stone-800/80 flex items-center justify-between">
                      <div className="font-bold text-base text-amber-400">
                        {formatMXN(product.price)}
                      </div>

                      {!isAvailable ? (
                        <span className="text-[11px] font-semibold text-rose-400 bg-rose-950/40 px-2 py-1 rounded-lg border border-rose-800/50">
                          Agotado hoy
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {inCartQty > 0 ? (
                            <div className="flex items-center gap-1 bg-stone-800 border border-stone-700 rounded-xl p-1">
                              <button
                                onClick={() => {
                                  const cartItem = currentCart.find(
                                    (i) => i.productId === product.id
                                  );
                                  if (cartItem) {
                                    updateCartItemQuantity(cartItem.id, -1);
                                  }
                                }}
                                className="w-6 h-6 rounded-lg bg-stone-700 hover:bg-stone-600 flex items-center justify-center text-white text-xs transition"
                              >
                                <Minus className="w-3 h-3" />
                              </button>

                              <span className="w-6 text-center text-xs font-bold text-amber-400">
                                {inCartQty}
                              </span>

                              <button
                                onClick={() => addToCart(product)}
                                className="w-6 h-6 rounded-lg bg-amber-500 hover:bg-amber-400 flex items-center justify-center text-stone-950 text-xs font-bold transition"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(product)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center gap-1.5 shadow-md shadow-amber-500/10 active:scale-95 transition"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Agregar</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Columna Derecha: Bandeja de Comanda Móvil Activa (5 columnas en desktop) */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-24">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Header de la comanda */}
            <div className="p-3.5 bg-stone-850 border-b border-stone-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-white">Comanda Actual</h3>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500 text-stone-950">
                    {selectedTable?.name || 'Mesa'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">
                  Mesero: {activeWaiter.nickname || activeWaiter.name}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {(currentCart.length > 0 || tablePastTickets.length > 0) && (
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(true)}
                    className="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1 py-1 px-2.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded-lg transition active:scale-95 cursor-pointer"
                    title="Generar reporte PDF de la comanda para WhatsApp o Correo"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reporte PDF</span>
                  </button>
                )}

                {currentCart.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 p-1 hover:bg-rose-950/30 rounded transition cursor-pointer"
                    title="Vaciar comanda"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Vaciar</span>
                  </button>
                )}
              </div>
            </div>

            {/* Lista de ítems en la comanda */}
            <div className="p-3 space-y-2.5 max-h-[380px] overflow-y-auto">
              {currentCart.length === 0 ? (
                <div className="py-12 text-center text-stone-500">
                  <Utensils className="w-10 h-10 mx-auto mb-2 opacity-30 text-amber-400" />
                  <p className="text-xs font-medium text-stone-400">
                    Comanda vacía para {selectedTable?.name}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Selecciona platillos del menú a la izquierda para armar el pedido en tiempo real.
                  </p>
                </div>
              ) : (
                currentCart.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-stone-850 border border-stone-750 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              item.destination === 'bar' ? 'bg-blue-400' : 'bg-orange-400'
                            }`}
                          />
                          <h5 className="font-semibold text-xs text-white truncate">
                            {item.productName}
                          </h5>
                        </div>
                        <div className="text-[11px] text-stone-400">
                          {formatMXN(item.unitPrice)} c/u
                        </div>
                      </div>

                      {/* Stepper + Total Item */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateCartItemQuantity(item.id, -1)}
                          className="w-6 h-6 rounded-lg bg-stone-750 hover:bg-stone-700 flex items-center justify-center text-stone-200 text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold text-amber-400">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartItemQuantity(item.id, 1)}
                          className="w-6 h-6 rounded-lg bg-stone-750 hover:bg-stone-700 flex items-center justify-center text-stone-200 text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 rounded text-stone-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Item Notes / Modifier Tag */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-800">
                      <button
                        onClick={() =>
                          setNoteModalItem({
                            id: item.id,
                            productName: item.productName,
                            currentNotes: item.notes,
                          })
                        }
                        className={`flex items-center gap-1 text-[11px] transition rounded px-1.5 py-0.5 ${
                          item.notes
                            ? 'bg-amber-500/20 text-amber-300 font-medium'
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        <MessageSquare className="w-3 h-3 text-amber-400" />
                        <span>{item.notes ? item.notes : '+ Nota especial'}</span>
                      </button>

                      <span className="font-bold text-xs text-stone-200">
                        {formatMXN(item.quantity * item.unitPrice)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Resumen Financiero y Envío */}
            {currentCart.length > 0 && (
              <div className="p-3.5 bg-stone-850 border-t border-stone-800 space-y-3">
                {/* Propina sugerida */}
                <div>
                  <div className="flex justify-between text-[11px] text-stone-400 mb-1">
                    <span>Propina sugerida servicio:</span>
                    <span>{tipPercentage}% ({formatMXN(tipAmount)})</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[0, 10, 15, 20].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setTipPercentage(pct)}
                        className={`py-1 rounded-lg text-xs font-semibold transition ${
                          tipPercentage === pct
                            ? 'bg-amber-500 text-stone-950 font-bold'
                            : 'bg-stone-800 text-stone-400 hover:bg-stone-750'
                        }`}
                      >
                        {pct === 0 ? 'Sin propina' : `${pct}%`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Desglose */}
                <div className="space-y-1 text-xs border-t border-stone-750 pt-2">
                  <div className="flex justify-between text-stone-400">
                    <span>Subtotal ({cartTotalItems} platillos):</span>
                    <span>{formatMXN(cartSubtotal)}</span>
                  </div>
                  {tipPercentage > 0 && (
                    <div className="flex justify-between text-amber-300/90">
                      <span>Propina estimada:</span>
                      <span>{formatMXN(tipAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-stone-750">
                    <span>Total Estimado:</span>
                    <span className="text-amber-400 font-extrabold">{formatMXN(cartTotal)}</span>
                  </div>
                </div>

                {/* BOTÓN REPORTE PDF (WHATSAPP / CORREO) */}
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="w-full py-2.5 px-3 rounded-xl font-semibold text-xs bg-stone-800 hover:bg-stone-750 text-amber-300 border border-amber-500/30 flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Reporte PDF de Comanda (WhatsApp / Correo)</span>
                </button>

                {/* BOTÓN PRINCIPAL: ENVIAR A COCINA */}
                <button
                  onClick={handleSendOrder}
                  className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 flex items-center justify-center gap-2 shadow-lg shadow-orange-950/40 active:scale-[0.98] transition cursor-pointer"
                >
                  <Send className="w-4 h-4 stroke-[2.5]" />
                  <span>ENVIAR A COCINA ({selectedTable?.name})</span>
                </button>
                <p className="text-[10px] text-center text-stone-400">
                  Campana instantánea • Aparece en el KDS de cocina y bar
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para Notas Rápidas */}
      {noteModalItem && (
        <QuickItemNotesModal
          isOpen={true}
          onClose={() => setNoteModalItem(null)}
          productName={noteModalItem.productName}
          currentNotes={noteModalItem.currentNotes}
          onSave={(notes) => {
            updateCartItemNotes(noteModalItem.id, notes);
          }}
        />
      )}

      {/* Modal para Reporte PDF de la Comanda */}
      {isReportModalOpen && selectedTable && (
        <ComandaReportModal
          isOpen={true}
          onClose={() => setIsReportModalOpen(false)}
          table={selectedTable}
          currentCartItems={currentCart}
          waiterName={activeWaiter.nickname || activeWaiter.name}
          tipPercentage={tipPercentage}
        />
      )}
    </div>
  );
};
