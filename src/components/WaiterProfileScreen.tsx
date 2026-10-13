import React, { useState } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { WaiterProfile } from '../types/restaurant';
import { formatMXN } from '../utils/currency';
import {
  User,
  ShieldCheck,
  Clock,
  Phone,
  DollarSign,
  TrendingUp,
  Award,
  Check,
  Plus,
  Users,
  KeyRound,
  Sparkles,
} from 'lucide-react';

const AVATAR_OPTIONS = ['👨‍🍳', '👩‍🍳', '🧑‍🍳', '🤵', '🦸', '🌟', '🌮', '🍸', '🔥', '🎩'];

const SHIFT_OPTIONS: WaiterProfile['shift'][] = [
  'Matutino (08:00 - 16:00)',
  'Vespertino (16:00 - 00:00)',
  'Nocturno (20:00 - 04:00)',
];

export const WaiterProfileScreen: React.FC = () => {
  const {
    activeWaiter,
    updateActiveWaiter,
    waiters,
    setActiveWaiterId,
    createNewWaiter,
  } = useRestaurant();

  // Local form state
  const [name, setName] = useState(activeWaiter.name);
  const [nickname, setNickname] = useState(activeWaiter.nickname);
  const [shift, setShift] = useState(activeWaiter.shift);
  const [phone, setPhone] = useState(activeWaiter.phone);
  const [pin, setPin] = useState(activeWaiter.pin);
  const [avatar, setAvatar] = useState(activeWaiter.avatar);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New waiter modal
  const [isNewWaiterModalOpen, setIsNewWaiterModalOpen] = useState(false);
  const [newWaiterName, setNewWaiterName] = useState('');
  const [newWaiterNickname, setNewWaiterNickname] = useState('');
  const [newWaiterPin, setNewWaiterPin] = useState('1122');
  const [newWaiterShift, setNewWaiterShift] = useState<WaiterProfile['shift']>('Vespertino (16:00 - 00:00)');
  const [newWaiterPhone, setNewWaiterPhone] = useState('+34 600 000 000');
  const [newWaiterAvatar, setNewWaiterAvatar] = useState('👨‍🍳');

  // Handle active waiter changes if user switches in the UI
  const handleSwitchWaiter = (waiterId: string) => {
    const target = waiters.find((w) => w.id === waiterId);
    if (target) {
      setActiveWaiterId(waiterId);
      setName(target.name);
      setNickname(target.nickname);
      setShift(target.shift);
      setPhone(target.phone);
      setPin(target.pin);
      setAvatar(target.avatar);
      setSavedSuccess(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateActiveWaiter({
      name: name.trim(),
      nickname: nickname.trim(),
      shift,
      phone: phone.trim(),
      pin: pin.trim(),
      avatar,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);
  };

  const handleCreateNewWaiter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWaiterName.trim()) return;

    createNewWaiter({
      name: newWaiterName.trim(),
      nickname: newWaiterNickname.trim() || newWaiterName.trim().split(' ')[0],
      shift: newWaiterShift,
      phone: newWaiterPhone.trim(),
      pin: newWaiterPin.trim(),
      avatar: newWaiterAvatar,
      avatarColor: 'from-amber-500 to-orange-600',
    });

    setIsNewWaiterModalOpen(false);
    setNewWaiterName('');
    setNewWaiterNickname('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-6">
      {/* Top Banner */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-3xl shadow-xl shadow-orange-950/40">
            {activeWaiter.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{activeWaiter.name}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                "{activeWaiter.nickname}"
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{activeWaiter.shift}</span>
            </p>
          </div>
        </div>

        {/* Quick Waiter Switcher Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-xs text-stone-400 font-medium mr-1 hidden sm:block">
            Mesero en turno:
          </div>
          {waiters.map((w) => (
            <button
              key={w.id}
              onClick={() => handleSwitchWaiter(w.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                w.id === activeWaiter.id
                  ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-750'
              }`}
            >
              <span>{w.avatar}</span>
              <span>{w.nickname || w.name}</span>
            </button>
          ))}

          <button
            onClick={() => setIsNewWaiterModalOpen(true)}
            className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-400 hover:text-white border border-stone-700 transition"
            title="Registrar nuevo mesero"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid: Métricas del Turno + Formulario de Edición */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Tarjetas de Desempeño y Métricas (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
            Métricas del Turno de Hoy
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
              <div className="flex items-center justify-between text-stone-400 mb-1">
                <span className="text-xs">Mesas Atendidas</span>
                <Users className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white">
                {activeWaiter.tablesServedToday}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">Cuentas cerradas</p>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
              <div className="flex items-center justify-between text-stone-400 mb-1">
                <span className="text-xs">Ventas del Turno</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 truncate">
                {formatMXN(activeWaiter.totalSalesToday)}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">Total facturado</p>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
              <div className="flex items-center justify-between text-stone-400 mb-1">
                <span className="text-xs">Propinas Hoy</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-400 truncate">
                {formatMXN(activeWaiter.tipsToday)}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">Generadas en propinas</p>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
              <div className="flex items-center justify-between text-stone-400 mb-1">
                <span className="text-xs">PIN de Seguridad</span>
                <KeyRound className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-mono font-black text-stone-200">
                ••••
              </div>
              <p className="text-[11px] text-stone-500 mt-1">Para comandas rápidas</p>
            </div>
          </div>

          <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-4 text-xs text-stone-400 space-y-2">
            <div className="font-semibold text-stone-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Rol & Privilegios de Mesero</span>
            </div>
            <p className="leading-relaxed">
              Tu perfil autoriza el envío de comandas directas a los fogones de cocina y a la barra de tragos, modificación de ítems en mesa y cálculo de cuentas con cobro inmediato.
            </p>
          </div>
        </div>

        {/* Columna Derecha: Formulario de Modificación de Perfil (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-800 mb-5">
              <div>
                <h3 className="font-bold text-base text-white">Editar Perfil de Mesero</h3>
                <p className="text-xs text-stone-400">
                  Actualiza tus datos para que aparezcan en los tickets de comanda
                </p>
              </div>

              {savedSuccess && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-semibold animate-in fade-in">
                  <Check className="w-4 h-4" />
                  <span>¡Guardado con éxito!</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Selector de Avatar */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-2">
                  Elige tu Avatar o Icono:
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setAvatar(av)}
                      className={`w-11 h-11 rounded-2xl text-xl flex items-center justify-center border transition-all ${
                        avatar === av
                          ? 'bg-amber-500/20 border-amber-400 scale-110 shadow-lg shadow-amber-500/20'
                          : 'bg-stone-800 border-stone-700 hover:bg-stone-750'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nombre y Apodo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Nombre Completo:
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-750 rounded-xl px-3 py-2.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Apodo / Alias (Tickets de Cocina):
                  </label>
                  <input
                    type="text"
                    required
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Ej: Charlie, Valen..."
                    className="w-full bg-stone-950 border border-stone-750 rounded-xl px-3 py-2.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Turno */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Turno de Trabajo:
                </label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value as WaiterProfile['shift'])}
                  className="w-full bg-stone-950 border border-stone-750 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  {SHIFT_OPTIONS.map((sh) => (
                    <option key={sh} value={sh}>
                      {sh}
                    </option>
                  ))}
                </select>
              </div>

              {/* Teléfono & PIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Teléfono de Contacto:
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+34 600 000 000"
                    className="w-full bg-stone-950 border border-stone-750 rounded-xl px-3 py-2.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    PIN de Acceso Rápido (4 dígitos):
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="1234"
                    className="w-full bg-stone-950 border border-stone-750 rounded-xl px-3 py-2.5 text-sm text-white font-mono tracking-widest placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Botón Guardar */}
              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 flex items-center gap-2 shadow-lg shadow-amber-500/20 transition active:scale-95"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Guardar Cambios de Perfil</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal para Crear un Nuevo Mesero */}
      {isNewWaiterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-750 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-white mb-1">Registrar Nuevo Mesero</h3>
            <p className="text-xs text-stone-400 mb-4">
              Agrega a un nuevo compañero de equipo para que pueda tomar comandas
            </p>

            <form onSubmit={handleCreateNewWaiter} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Nombre Completo:
                </label>
                <input
                  type="text"
                  required
                  value={newWaiterName}
                  onChange={(e) => setNewWaiterName(e.target.value)}
                  placeholder="Ej: Sofía Ramírez"
                  className="w-full bg-stone-950 border border-stone-750 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Apodo / Alias:
                  </label>
                  <input
                    type="text"
                    value={newWaiterNickname}
                    onChange={(e) => setNewWaiterNickname(e.target.value)}
                    placeholder="Ej: Sofi"
                    className="w-full bg-stone-950 border border-stone-750 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    PIN (4 dígitos):
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={newWaiterPin}
                    onChange={(e) => setNewWaiterPin(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-750 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Turno:
                </label>
                <select
                  value={newWaiterShift}
                  onChange={(e) => setNewWaiterShift(e.target.value as WaiterProfile['shift'])}
                  className="w-full bg-stone-950 border border-stone-750 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {SHIFT_OPTIONS.map((sh) => (
                    <option key={sh} value={sh}>
                      {sh}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewWaiterModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950"
                >
                  Crear Mesero
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
