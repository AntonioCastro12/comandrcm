import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { RestaurantTable } from '../types/restaurant';
import { formatMXN } from '../utils/currency';
import { BillModal } from './BillModal';
import {
  LayoutGrid,
  Users,
  Utensils,
  Receipt,
  Clock,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Settings2,
  MapPin,
  Check,
  X,
  SlidersHorizontal,
  FileText,
} from 'lucide-react';
import { ComandaReportModal } from './ComandaReportModal';

export const TablesScreen: React.FC = () => {
  const {
    tables,
    setSelectedTableId,
    setActiveScreen,
    activeWaiter,
    addTable,
    updateTable,
    deleteTable,
    moveTableOrder,
  } = useRestaurant();

  const [selectedArea, setSelectedArea] = useState<string>('todas');
  const [billModalTable, setBillModalTable] = useState<RestaurantTable | null>(null);
  const [reportModalTable, setReportModalTable] = useState<RestaurantTable | null>(null);

  // Modo Editor de Salón / Plano
  const [isEditMode, setIsEditMode] = useState(false);

  // Modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [deletingTable, setDeletingTable] = useState<RestaurantTable | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formNumber, setFormNumber] = useState<number>(1);
  const [formArea, setFormArea] = useState('Salón Principal');
  const [formCapacity, setFormCapacity] = useState<number>(4);
  const [formShape, setFormShape] = useState<RestaurantTable['shape']>('cuadrada');

  // Áreas únicas existentes
  const uniqueAreas = useMemo(() => {
    const set = new Set<string>();
    tables.forEach((t) => set.add(t.area));
    return Array.from(set);
  }, [tables]);

  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      return selectedArea === 'todas' || t.area === selectedArea;
    });
  }, [tables, selectedArea]);

  const occupiedCount = tables.filter((t) => t.status === 'ocupada').length;
  const billRequestedCount = tables.filter((t) => t.status === 'cuenta_pedida').length;
  const availableCount = tables.filter((t) => t.status === 'disponible').length;

  const totalRevenueInTables = tables.reduce((sum, t) => {
    return (
      sum +
      t.tickets.reduce((ticketSum, tk) => {
        return (
          ticketSum +
          tk.items.reduce((itemSum, it) => itemSum + it.quantity * it.unitPrice, 0)
        );
      }, 0)
    );
  }, 0);

  const formatElapsedMinutes = (openedAt?: number) => {
    if (!openedAt) return '';
    const mins = Math.floor((Date.now() - openedAt) / (1000 * 60));
    return `${mins} min`;
  };

  const handleOpenOrder = (tableId: string) => {
    setSelectedTableId(tableId);
    setActiveScreen('waiter');
  };

  const handleOpenAddModal = () => {
    const nextNumber = tables.length > 0 ? Math.max(...tables.map((t) => t.number)) + 1 : 1;
    setFormNumber(nextNumber);
    setFormName(`Mesa ${nextNumber}`);
    setFormArea(uniqueAreas[0] || 'Salón Principal');
    setFormCapacity(4);
    setFormShape('cuadrada');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (table: RestaurantTable) => {
    setEditingTable(table);
    setFormNumber(table.number);
    setFormName(table.name);
    setFormArea(table.area);
    setFormCapacity(table.capacity);
    setFormShape(table.shape || 'cuadrada');
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formArea.trim()) return;

    addTable({
      number: formNumber,
      name: formName.trim(),
      area: formArea.trim(),
      capacity: formCapacity,
      shape: formShape,
    });
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable || !formName.trim() || !formArea.trim()) return;

    updateTable(editingTable.id, {
      number: formNumber,
      name: formName.trim(),
      area: formArea.trim(),
      capacity: formCapacity,
      shape: formShape,
    });
    setEditingTable(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4">
      {/* Overview Banner con Modo Edición */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Mapa & Acomodo de Mesas
                {isEditMode && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500 text-stone-950 font-bold animate-pulse">
                    MODO EDITOR ACTIVO
                  </span>
                )}
              </h2>
              <p className="text-xs text-stone-400">
                {isEditMode
                  ? 'Reordena mesas, cambia nombres, añade nuevas áreas o retira mesas.'
                  : 'Monitorea consumos en vivo, abre comandas y realiza cobros.'}
              </p>
            </div>
          </div>
        </div>

        {/* Acciones principales de mesa y editor */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              isEditMode
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-750'
            }`}
            title="Activar modo para mover, cambiar nombre o acomodar mesas"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{isEditMode ? 'Guardar & Salir del Editor' : '🛠️ Modificar Acomodo & Mesas'}</span>
          </button>

          {isEditMode && (
            <button
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-stone-950 flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>+ Agregar Nueva Mesa</span>
            </button>
          )}

          {!isEditMode && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              <div className="px-2.5 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300">
                Libres: <strong>{availableCount}</strong>
              </div>
              <div className="px-2.5 py-1.5 rounded-xl bg-orange-950/40 border border-orange-500/40 text-orange-300">
                Ocupadas: <strong>{occupiedCount}</strong>
              </div>
              {billRequestedCount > 0 && (
                <div className="px-2.5 py-1.5 rounded-xl bg-purple-950/50 border border-purple-500/50 text-purple-300 animate-pulse">
                  Cuenta pedida: <strong>{billRequestedCount}</strong>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter by Area / Ubicación */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedArea('todas')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedArea === 'todas'
                ? 'bg-amber-500 text-stone-950 shadow'
                : 'bg-stone-850 text-stone-300 hover:bg-stone-800'
            }`}
          >
            Todas las Áreas ({tables.length})
          </button>

          {uniqueAreas.map((area) => {
            const countInArea = tables.filter((t) => t.area === area).length;
            return (
              <button
                key={area}
                onClick={() => setSelectedArea(area)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedArea === area
                    ? 'bg-amber-500 text-stone-950 shadow'
                    : 'bg-stone-850 text-stone-300 hover:bg-stone-800'
                }`}
              >
                {area} ({countInArea})
              </button>
            );
          })}
        </div>

        {isEditMode && (
          <span className="text-[11px] text-stone-400 hidden lg:block">
            Usa las flechas ⬆️ / ⬇️ en cada mesa para ordenar la distribución
          </span>
        )}
      </div>

      {/* Grid of Tables */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTables.map((table, index) => {
          const isOccupied = table.status === 'ocupada';
          const isBill = table.status === 'cuenta_pedida';
          const isAvailable = table.status === 'disponible';

          const tableTotal = table.tickets.reduce((acc, tk) => {
            return (
              acc +
              tk.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0)
            );
          }, 0);

          const itemsCount = table.tickets.reduce((acc, tk) => {
            return acc + tk.items.reduce((s, it) => s + it.quantity, 0);
          }, 0);

          return (
            <div
              key={table.id}
              className={`rounded-3xl border p-4 sm:p-5 flex flex-col justify-between transition-all shadow-md ${
                isEditMode
                  ? 'border-dashed border-amber-500/60 bg-stone-900 ring-1 ring-amber-500/20'
                  : isBill
                  ? 'bg-purple-950/20 border-purple-500/70 ring-1 ring-purple-500/30'
                  : isOccupied
                  ? 'bg-stone-850 border-orange-500/60 ring-1 ring-orange-500/20'
                  : 'bg-stone-900 border-stone-800 hover:border-stone-700'
              }`}
            >
              <div>
                {/* Header card */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-10 h-10 rounded-2xl font-black flex items-center justify-center text-sm shadow-inner ${
                        isEditMode
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : isBill
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : isOccupied
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-stone-800 text-stone-300 border border-stone-700'
                      }`}
                    >
                      #{table.number}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white truncate max-w-[170px]">
                        {table.name}
                      </h4>
                      <p className="text-[11px] text-stone-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        <span>{table.area}</span>
                        <span>•</span>
                        <span>{table.capacity} personas</span>
                      </p>
                    </div>
                  </div>

                  {/* Estado o Badge de Forma */}
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isBill
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : isOccupied
                          ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}
                    >
                      {isBill
                        ? 'Cuenta Pedida'
                        : isOccupied
                        ? 'Ocupada'
                        : 'Disponible'}
                    </span>
                    {table.shape && (
                      <span className="text-[10px] text-stone-400 capitalize">
                        Forma {table.shape}
                      </span>
                    )}
                  </div>
                </div>

                {/* Details en Modo Servicio vs Editor */}
                {!isEditMode ? (
                  <div className="my-3 space-y-1.5 text-xs text-stone-300">
                    {isAvailable ? (
                      <div className="py-4 text-center text-stone-500 text-xs">
                        Mesa libre. Toca abajo para abrir comanda para clientes.
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between text-stone-400">
                          <span>Mesero a cargo:</span>
                          <strong className="text-stone-200">
                            {table.currentWaiterName || activeWaiter.name}
                          </strong>
                        </div>
                        <div className="flex justify-between text-stone-400">
                          <span>Tiempo en mesa:</span>
                          <span className="flex items-center gap-1 text-stone-300">
                            <Clock className="w-3 h-3 text-amber-400" />
                            {formatElapsedMinutes(table.openedAt)}
                          </span>
                        </div>
                        <div className="flex justify-between text-stone-400">
                          <span>Comandas enviadas:</span>
                          <span className="text-stone-300">
                            {table.tickets.length} ronda(s) ({itemsCount} platillos)
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-stone-750 font-semibold text-white">
                          <span>Consumo acumulado:</span>
                          <span className="text-amber-400 font-bold text-sm">
                            {formatMXN(tableTotal)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  /* Modo Editor de Acomodo */
                  <div className="my-3 p-3 rounded-2xl bg-stone-850/80 border border-stone-750 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-stone-400">
                      <span>Posición en plano:</span>
                      <strong className="text-white">#{index + 1} de {filteredTables.length}</strong>
                    </div>
                    <div className="flex items-center justify-between text-stone-400">
                      <span>Ubicación / Zona:</span>
                      <strong className="text-amber-300">{table.area}</strong>
                    </div>
                    <div className="flex items-center justify-between text-stone-400">
                      <span>Capacidad máxima:</span>
                      <span className="text-stone-200">{table.capacity} comensales</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Botones de Acción (Modo Servicio vs Modo Editor) */}
              <div className="pt-2 border-t border-stone-800 flex items-center gap-2">
                {!isEditMode ? (
                  <>
                    <button
                      onClick={() => handleOpenOrder(table.id)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center justify-center gap-1.5 transition"
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      <span>{isAvailable ? 'Abrir Comanda' : 'Modificar Pedido'}</span>
                    </button>

                    {!isAvailable && (
                      <button
                        onClick={() => setBillModalTable(table)}
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 flex items-center gap-1 transition"
                        title="Ver cuenta y cobrar"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Cobrar</span>
                      </button>
                    )}

                    {!isAvailable && (
                      <button
                        onClick={() => setReportModalTable(table)}
                        className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 flex items-center gap-1 transition cursor-pointer"
                        title="Generar y compartir reporte PDF de la comanda (WhatsApp o Correo)"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        <span>PDF</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenEditModal(table)}
                      className="p-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-400 hover:text-white transition"
                      title="Editar nombre o ubicación de esta mesa"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  /* Acciones en Modo Editor de Salón */
                  <div className="w-full flex items-center justify-between gap-1.5">
                    {/* Botones para Acomodar / Reordenar */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveTableOrder(table.id, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 disabled:opacity-30 disabled:pointer-events-none text-stone-300 hover:text-white border border-stone-700 transition"
                        title="Mover arriba / antes en el acomodo"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveTableOrder(table.id, 'down')}
                        disabled={index === filteredTables.length - 1}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 disabled:opacity-30 disabled:pointer-events-none text-stone-300 hover:text-white border border-stone-700 transition"
                        title="Mover abajo / después en el acomodo"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(table)}
                        className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => setDeletingTable(table)}
                        className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition"
                        title="Quitar / Eliminar mesa del salón"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal para AGREGAR NUEVA MESA */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-750 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-stone-850 border-b border-stone-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Agregar Nueva Mesa al Restaurante
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Número de Mesa:
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formNumber}
                    onChange={(e) => setFormNumber(parseInt(e.target.value) || 1)}
                    className="w-full bg-stone-950 border border-stone-750 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Capacidad (Personas):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(parseInt(e.target.value) || 2)}
                    className="w-full bg-stone-950 border border-stone-750 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Nombre o Identificador de Mesa:
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Mesa 10, Terraza VIP, Barra 3..."
                  className="w-full bg-stone-950 border border-stone-750 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Ubicación / Área del Restaurante:
                </label>
                <input
                  type="text"
                  required
                  value={formArea}
                  onChange={(e) => setFormArea(e.target.value)}
                  placeholder="Ej: Salón Principal, Terraza, Barra, Jardín, VIP..."
                  className="w-full bg-stone-950 border border-stone-750 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />

                {/* Sugerencias de áreas rápidas */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] text-stone-400">Áreas existentes:</span>
                  {uniqueAreas.map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => setFormArea(area)}
                      className="px-2 py-0.5 rounded text-[10px] bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-750 border border-stone-700"
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Forma de la Mesa:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['cuadrada', 'redonda', 'rectangular'] as const).map((sh) => (
                    <button
                      key={sh}
                      type="button"
                      onClick={() => setFormShape(sh)}
                      className={`py-2 rounded-xl text-xs font-semibold capitalize border transition ${
                        formShape === sh
                          ? 'bg-amber-500 border-amber-400 text-stone-950 font-bold'
                          : 'bg-stone-850 border-stone-750 text-stone-400 hover:bg-stone-800'
                      }`}
                    >
                      {sh}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-stone-950 flex items-center gap-1.5 shadow"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Crear Mesa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para EDITAR MESA EXISTENTE */}
      {editingTable && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-750 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-stone-850 border-b border-stone-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                Modificar Mesa: {editingTable.name}
              </h3>
              <button
                onClick={() => setEditingTable(null)}
                className="p-1 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Número de Mesa:
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formNumber}
                    onChange={(e) => setFormNumber(parseInt(e.target.value) || 1)}
                    className="w-full bg-stone-950 border border-stone-750 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Capacidad (Personas):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(parseInt(e.target.value) || 2)}
                    className="w-full bg-stone-950 border border-stone-750 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Nombre de Mesa:
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-750 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Ubicación / Área:
                </label>
                <input
                  type="text"
                  required
                  value={formArea}
                  onChange={(e) => setFormArea(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-750 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />

                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] text-stone-400">Cambiar a:</span>
                  {uniqueAreas.map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => setFormArea(area)}
                      className="px-2 py-0.5 rounded text-[10px] bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-750 border border-stone-700"
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Forma de la Mesa:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['cuadrada', 'redonda', 'rectangular'] as const).map((sh) => (
                    <button
                      key={sh}
                      type="button"
                      onClick={() => setFormShape(sh)}
                      className={`py-2 rounded-xl text-xs font-semibold capitalize border transition ${
                        formShape === sh
                          ? 'bg-amber-500 border-amber-400 text-stone-950 font-bold'
                          : 'bg-stone-850 border-stone-750 text-stone-400 hover:bg-stone-800'
                      }`}
                    >
                      {sh}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTable(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center gap-1.5 shadow"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para ELIMINAR / QUITAR MESA */}
      {deletingTable && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-750 rounded-3xl max-w-sm w-full p-5 shadow-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <h4 className="text-base font-bold text-white">¿Quitar esta mesa?</h4>
            <p className="text-xs text-stone-400">
              Vas a retirar <strong>"{deletingTable.name}"</strong> ({deletingTable.area}) del plano del restaurante.
              {deletingTable.status !== 'disponible' && (
                <span className="text-rose-400 block mt-1 font-semibold">
                  ⚠️ Atención: Esta mesa tiene consumos o comandas activas.
                </span>
              )}
            </p>

            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={() => setDeletingTable(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-300 hover:bg-stone-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteTable(deletingTable.id);
                  setDeletingTable(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white"
              >
                Sí, quitar mesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill & Settlement Modal */}
      {billModalTable && (
        <BillModal
          table={billModalTable}
          onClose={() => setBillModalTable(null)}
        />
      )}

      {/* Comanda Report Modal */}
      {reportModalTable && (
        <ComandaReportModal
          isOpen={true}
          onClose={() => setReportModalTable(null)}
          table={reportModalTable}
          waiterName={reportModalTable.currentWaiterName || activeWaiter.name}
        />
      )}
    </div>
  );
};
