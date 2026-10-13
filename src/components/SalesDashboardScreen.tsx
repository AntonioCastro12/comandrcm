import React, { useMemo, useState } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { ProductCategory } from '../types/restaurant';
import { formatMXN } from '../utils/currency';
import { downloadTicketPDF } from '../utils/pdfTicketGenerator';
import {
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Users,
  Flame,
  Wine,
  Sparkles,
  ArrowUpRight,
  Receipt,
  Clock,
  Award,
  ChevronDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';

const CATEGORY_CONFIG: Record<
  ProductCategory,
  { label: string; color: string; icon: string }
> = {
  fuertes: { label: 'Platos Fuertes', color: '#f59e0b', icon: '🥩' }, // amber-500
  entradas: { label: 'Entradas', color: '#10b981', icon: '🥗' }, // emerald-500
  cocteles: { label: 'Coctelería', color: '#8b5cf6', icon: '🍸' }, // violet-500
  bebidas: { label: 'Bebidas', color: '#3b82f6', icon: '🥤' }, // blue-500
  postres: { label: 'Postres', color: '#ec4899', icon: '🍰' }, // pink-500
};

export const SalesDashboardScreen: React.FC = () => {
  const { salesRecords, tables } = useRestaurant();
  const [selectedView, setSelectedView] = useState<'todo' | 'comida' | 'bebidas'>('todo');

  // Compute live open tables revenue
  const openTablesRevenue = useMemo(() => {
    return tables.reduce((sum, t) => {
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
  }, [tables]);

  // Aggregate Category Sales from settled records
  const categoryStats = useMemo(() => {
    const stats: Record<
      ProductCategory,
      {
        category: ProductCategory;
        label: string;
        totalMXN: number;
        quantity: number;
        topItem: { name: string; total: number };
      }
    > = {
      fuertes: { category: 'fuertes', label: 'Platos Fuertes', totalMXN: 0, quantity: 0, topItem: { name: '', total: 0 } },
      entradas: { category: 'entradas', label: 'Entradas', totalMXN: 0, quantity: 0, topItem: { name: '', total: 0 } },
      cocteles: { category: 'cocteles', label: 'Coctelería', totalMXN: 0, quantity: 0, topItem: { name: '', total: 0 } },
      bebidas: { category: 'bebidas', label: 'Bebidas', totalMXN: 0, quantity: 0, topItem: { name: '', total: 0 } },
      postres: { category: 'postres', label: 'Postres', totalMXN: 0, quantity: 0, topItem: { name: '', total: 0 } },
    };

    const itemTotals: Record<string, { name: string; category: ProductCategory; total: number; qty: number }> = {};

    salesRecords.forEach((record) => {
      record.items.forEach((item) => {
        const cat = item.category || 'fuertes';
        const lineTotal = item.quantity * item.unitPrice;

        if (stats[cat]) {
          stats[cat].totalMXN += lineTotal;
          stats[cat].quantity += item.quantity;
        }

        // Track per product for top item calculation
        if (!itemTotals[item.productId]) {
          itemTotals[item.productId] = {
            name: item.productName,
            category: cat,
            total: 0,
            qty: 0,
          };
        }
        itemTotals[item.productId].total += lineTotal;
        itemTotals[item.productId].qty += item.quantity;
      });
    });

    // Find top item per category
    Object.values(itemTotals).forEach((item) => {
      const cat = item.category;
      if (stats[cat] && item.total > stats[cat].topItem.total) {
        stats[cat].topItem = { name: item.name, total: item.total };
      }
    });

    return stats;
  }, [salesRecords]);

  // Total Settled Sales
  const totalSettledMXN = useMemo(() => {
    return salesRecords.reduce((acc, s) => acc + s.subtotal, 0);
  }, [salesRecords]);

  const totalTipsMXN = useMemo(() => {
    return salesRecords.reduce((acc, s) => acc + s.tip, 0);
  }, [salesRecords]);

  const totalItemsSold = useMemo(() => {
    return salesRecords.reduce(
      (acc, s) => acc + s.items.reduce((sum, i) => sum + i.quantity, 0),
      0
    );
  }, [salesRecords]);

  const avgTicketMXN = useMemo(() => {
    if (salesRecords.length === 0) return 0;
    return totalSettledMXN / salesRecords.length;
  }, [salesRecords, totalSettledMXN]);

  // Data for Recharts Bar Chart & Pie Chart
  const categoryChartData = useMemo(() => {
    const list = Object.values(categoryStats).map((cat) => ({
      name: cat.label,
      categoryKey: cat.category,
      ingresos: cat.totalMXN,
      cantidad: cat.quantity,
      fill: CATEGORY_CONFIG[cat.category].color,
      icon: CATEGORY_CONFIG[cat.category].icon,
    }));

    if (selectedView === 'comida') {
      return list.filter((c) => ['fuertes', 'entradas', 'postres'].includes(c.categoryKey));
    }
    if (selectedView === 'bebidas') {
      return list.filter((c) => ['cocteles', 'bebidas'].includes(c.categoryKey));
    }
    return list;
  }, [categoryStats, selectedView]);

  // Data for Hourly Area Chart (flujo del turno)
  const hourlyChartData = useMemo(() => {
    // Generate hours from 12:00 to 22:00
    const hoursMap: Record<string, number> = {
      '12:00': 450,
      '13:00': 1474,
      '14:00': 1065,
      '15:00': 2110,
      '16:00': 640,
      '17:00': 2980,
      '18:00': 1850,
      '19:00': 2400,
      '20:00': 3100,
      '21:00': 1950,
    };

    // Integrate live timestamps from salesRecords
    salesRecords.forEach((record) => {
      const date = new Date(record.timestamp);
      const hourStr = `${date.getHours().toString().padStart(2, '0')}:00`;
      if (hoursMap[hourStr]) {
        hoursMap[hourStr] += record.subtotal;
      } else {
        hoursMap[hourStr] = record.subtotal;
      }
    });

    return Object.entries(hoursMap).map(([hora, total]) => ({
      hora,
      ingresos: total,
    }));
  }, [salesRecords]);

  // Top 5 Platillos Más Vendidos
  const topProductsList = useMemo(() => {
    const map: Record<string, { name: string; category: ProductCategory; total: number; qty: number }> = {};
    salesRecords.forEach((rec) => {
      rec.items.forEach((item) => {
        if (!map[item.productId]) {
          map[item.productId] = {
            name: item.productName,
            category: item.category || 'fuertes',
            total: 0,
            qty: 0,
          };
        }
        map[item.productId].total += item.quantity * item.unitPrice;
        map[item.productId].qty += item.quantity;
      });
    });
    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [salesRecords]);

  // Kitchen vs Bar Destination Breakdown
  const destinationData = useMemo(() => {
    let cocinaTotal = 0;
    let barTotal = 0;
    salesRecords.forEach((rec) => {
      rec.items.forEach((it) => {
        if (it.destination === 'bar') {
          barTotal += it.quantity * it.unitPrice;
        } else {
          cocinaTotal += it.quantity * it.unitPrice;
        }
      });
    });
    return [
      { name: 'Cocina 🔥', total: cocinaTotal, fill: '#f97316' },
      { name: 'Bar 🍹', total: barTotal, fill: '#3b82f6' },
    ];
  }, [salesRecords]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-6">
      {/* Header Banner */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Dashboard de Ventas Diarias
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
                  MXN
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Monitoreo analítico de ingresos en tiempo real desglosado por categorías
              </p>
            </div>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-stone-800 border border-stone-700 rounded-xl p-1 text-xs">
            <button
              onClick={() => setSelectedView('todo')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                selectedView === 'todo'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Todas las Categorías
            </button>
            <button
              onClick={() => setSelectedView('comida')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                selectedView === 'comida'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Solo Comida
            </button>
            <button
              onClick={() => setSelectedView('bebidas')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                selectedView === 'bebidas'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Solo Bebidas & Cocteles
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Ventas Cobradas */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold">Total Ingresos del Día</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {formatMXN(totalSettledMXN)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1 flex items-center justify-between">
            <span>{salesRecords.length} cuentas cobradas</span>
            <span className="text-amber-400 font-semibold">
              +{formatMXN(openTablesRevenue)} en mesas activas
            </span>
          </div>
        </div>

        {/* Card 2: Ticket Promedio */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold">Ticket Promedio por Mesa</span>
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-white">
            {formatMXN(avgTicketMXN)}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Gasto medio por orden cerrada hoy
          </p>
        </div>

        {/* Card 3: Propinas del Turno */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold">Total Propinas Recaudadas</span>
            <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-400">
            {formatMXN(totalTipsMXN)}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            ~{totalSettledMXN > 0 ? ((totalTipsMXN / totalSettledMXN) * 100).toFixed(1) : 0}% promedio de propina
          </p>
        </div>

        {/* Card 4: Artículos Vendidos */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold">Platillos & Tragos Despachados</span>
            <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
              <BarChart3 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-white">
            {totalItemsSold} <span className="text-sm font-normal text-stone-400">ítems</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Entre cocina y barra de bebidas
          </p>
        </div>
      </div>

      {/* Main Charts Row: Recharts Bar Chart (Ingresos por Categoría) + Donut Chart (% Participación) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráfico 1: Barra de Ingresos en MXN por Categoría (7 cols) */}
        <div className="lg:col-span-7 bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  Ingresos en Pesos Mexicanos (MXN) por Categoría
                </h3>
                <p className="text-xs text-stone-400">
                  Total monetario facturado hoy en cada sección de la carta
                </p>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryChartData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#a8a29e"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    stroke="#a8a29e"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1c1917',
                      borderColor: '#44403c',
                      borderRadius: '0.75rem',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(value: unknown) => [formatMXN(Number(value) || 0), 'Ingresos']}
                    labelStyle={{ color: '#fbbf24', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="ingresos" radius={[8, 8, 0, 0]} maxBarSize={55}>
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 flex-wrap pt-3 border-t border-stone-800 text-xs text-stone-400">
            {categoryChartData.map((c) => (
              <div key={c.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.fill }} />
                <span>{c.name}: <strong className="text-white">{formatMXN(c.ingresos)}</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico 2: Participación Porcentual (Donut Chart) (5 cols) */}
        <div className="lg:col-span-5 bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-amber-400" />
                Participación de Ventas por Categoría
              </h3>
            </div>
            <p className="text-xs text-stone-400 mb-3">
              Porcentaje del total de ingresos generado por cada área
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="ingresos"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-pie-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1c1917',
                      borderColor: '#44403c',
                      borderRadius: '0.75rem',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(value: unknown) => [
                      `${formatMXN(Number(value) || 0)} (${totalSettledMXN > 0 ? (((Number(value) || 0) / totalSettledMXN) * 100).toFixed(1) : 0}%)`,
                      'Venta',
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-stone-800">
            {categoryChartData.map((item) => {
              const pct = totalSettledMXN > 0 ? ((item.ingresos / totalSettledMXN) * 100).toFixed(1) : '0';
              return (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-stone-300">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400">{pct}%</span>
                    <strong className="text-white font-mono">{formatMXN(item.ingresos)}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Second Charts Row: Flujo Horario del Turno (Area Chart) + Top Platillos & Destino */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Flujo Horario en MXN */}
        <div className="lg:col-span-7 bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Flujo de Ingresos por Hora del Turno (MXN)
              </h3>
              <p className="text-xs text-stone-400">
                Picos de facturación durante las horas pico de comida y cena
              </p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={hourlyChartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                <XAxis dataKey="hora" stroke="#a8a29e" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#a8a29e"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1c1917',
                    borderColor: '#44403c',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(value: unknown) => [formatMXN(Number(value) || 0), 'Venta en hora']}
                  labelStyle={{ color: '#fbbf24', fontWeight: 'bold' }}
                />
                <Area
                  type="monotone"
                  dataKey="ingresos"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorIngresos)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Platillos Más Vendidos & Cocina vs Bar */}
        <div className="lg:col-span-5 bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-amber-400" />
              Top Platillos Más Vendidos (MXN)
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              Platos con mayor volumen de facturación hoy
            </p>

            <div className="space-y-3">
              {topProductsList.map((prod, idx) => {
                const maxVal = topProductsList[0]?.total || 1;
                const widthPct = Math.round((prod.total / maxVal) * 100);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                        <span className="font-bold text-amber-400 font-mono">#{idx + 1}</span>
                        <span className="text-stone-200 font-medium truncate">{prod.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-stone-400">{prod.qty} uds</span>
                        <strong className="text-white font-mono">{formatMXN(prod.total)}</strong>
                      </div>
                    </div>

                    <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cocina vs Bar Destino */}
          <div className="mt-5 pt-3 border-t border-stone-800">
            <div className="flex justify-between text-xs text-stone-400 mb-1.5">
              <span>Desglose Cocina vs Bar:</span>
              <span className="text-white font-semibold">
                Cocina: {formatMXN(destinationData[0].total)} • Bar: {formatMXN(destinationData[1].total)}
              </span>
            </div>
            <div className="w-full h-2.5 bg-stone-800 rounded-full flex overflow-hidden">
              <div
                className="bg-orange-500 h-full"
                style={{
                  width: `${
                    totalSettledMXN > 0
                      ? (destinationData[0].total / (destinationData[0].total + destinationData[1].total)) * 100
                      : 50
                  }%`,
                }}
                title="Cocina"
              />
              <div
                className="bg-blue-500 h-full"
                style={{
                  width: `${
                    totalSettledMXN > 0
                      ? (destinationData[1].total / (destinationData[0].total + destinationData[1].total)) * 100
                      : 50
                  }%`,
                }}
                title="Bar"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla Detallada por Categoría de Productos */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-white">
              Resumen Detallado por Categoría de Producto
            </h3>
            <p className="text-xs text-stone-400">
              Desglose analítico de unidades despachadas, ingresos en MXN y plato estrella
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-800 text-stone-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-3">Unidades Vendidas</th>
                <th className="py-3 px-3">Ingresos Totales (MXN)</th>
                <th className="py-3 px-3">% Contribución</th>
                <th className="py-3 px-3">Plato Estrella</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60">
              {(Object.keys(categoryStats) as ProductCategory[]).map((catKey) => {
                const stat = categoryStats[catKey];
                const cfg = CATEGORY_CONFIG[catKey];
                const pct = totalSettledMXN > 0 ? ((stat.totalMXN / totalSettledMXN) * 100).toFixed(1) : '0';

                return (
                  <tr key={catKey} className="hover:bg-stone-850/50 transition">
                    <td className="py-3.5 px-3 font-semibold text-white flex items-center gap-2">
                      <span className="text-base">{cfg.icon}</span>
                      <span>{stat.label}</span>
                    </td>
                    <td className="py-3.5 px-3 text-stone-300 font-medium">
                      {stat.quantity} unidades
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-amber-400 text-sm">
                      {formatMXN(stat.totalMXN)}
                    </td>
                    <td className="py-3.5 px-3 text-stone-300">
                      <span className="px-2 py-0.5 rounded-full bg-stone-800 border border-stone-700 font-semibold">
                        {pct}%
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-stone-400">
                      {stat.topItem.name ? (
                        <span className="text-stone-200">
                          {stat.topItem.name}{' '}
                          <span className="text-stone-500 font-mono">({formatMXN(stat.topItem.total)})</span>
                        </span>
                      ) : (
                        <span className="text-stone-500 italic">Sin ventas registradas</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-stone-750 font-bold text-xs bg-stone-850/30">
                <td className="py-3 px-3 text-white">TOTAL DEL DÍA</td>
                <td className="py-3 px-3 text-white">{totalItemsSold} unidades</td>
                <td className="py-3 px-3 text-emerald-400 text-sm font-mono font-black">
                  {formatMXN(totalSettledMXN)}
                </td>
                <td className="py-3 px-3 text-white">100%</td>
                <td className="py-3 px-3 text-stone-400">+ {formatMXN(totalTipsMXN)} en propinas</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Historial de Cuentas Cerradas con Reenvío de Ticket por WhatsApp/Email */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-400" />
              Historial de Cuentas Cobradas (Reenvío de Ticket Digital)
            </h3>
            <p className="text-xs text-stone-400">
              Copia o reenvía el ticket por WhatsApp y correo a cualquier cliente que lo solicite
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {salesRecords.map((sale) => {
            const timeStr = new Date(sale.timestamp).toLocaleTimeString('es-MX', {
              hour: '2-digit',
              minute: '2-digit',
            });

            const shareWhatsAppForSale = () => {
              const text = [
                `🧾 *TICKET DIGITAL - ComandaRCM*`,
                `📍 Mesa: *${sale.tableName}*`,
                `👨‍🍳 Mesero: ${sale.waiterName}`,
                `🕒 Hora: ${timeStr}`,
                `----------------------------------------`,
              ];
              sale.items.forEach((it) => {
                text.push(`• ${it.quantity}x ${it.productName} - ${formatMXN(it.quantity * it.unitPrice)}`);
              });
              text.push(`----------------------------------------`);
              text.push(`Subtotal: ${formatMXN(sale.subtotal)}`);
              if (sale.tip > 0) text.push(`Propina: ${formatMXN(sale.tip)}`);
              text.push(`*TOTAL: ${formatMXN(sale.total)}* (${sale.paymentMethod})`);
              text.push(`✨ ¡Gracias por su visita a ComandaRCM!`);

              const url = `https://wa.me/?text=${encodeURIComponent(text.join('\n'))}`;
              window.open(url, '_blank');
            };

            const shareEmailForSale = () => {
              const text = [
                `TICKET DIGITAL - ComandaRCM`,
                `Mesa: ${sale.tableName}`,
                `Mesero: ${sale.waiterName}`,
                `Hora: ${timeStr}`,
                `----------------------------------------`,
              ];
              sale.items.forEach((it) => {
                text.push(`• ${it.quantity}x ${it.productName} - ${formatMXN(it.quantity * it.unitPrice)}`);
              });
              text.push(`----------------------------------------`);
              text.push(`Subtotal: ${formatMXN(sale.subtotal)}`);
              if (sale.tip > 0) text.push(`Propina: ${formatMXN(sale.tip)}`);
              text.push(`TOTAL: ${formatMXN(sale.total)} (${sale.paymentMethod})`);
              text.push(`¡Gracias por su visita a ComandaRCM!`);

              const url = `mailto:?subject=${encodeURIComponent(
                `Ticket de Consumo - ${sale.tableName}`
              )}&body=${encodeURIComponent(text.join('\n'))}`;
              window.location.href = url;
            };

            const downloadPdfForSale = () => {
              downloadTicketPDF({
                restaurantName: 'ComandaRCM',
                tableName: sale.tableName,
                tableNumber: sale.tableNumber,
                waiterName: sale.waiterName,
                subtotal: sale.subtotal,
                tax: sale.subtotal * 0.16,
                tip: sale.tip,
                tipPercentage: sale.subtotal > 0 ? Math.round((sale.tip / sale.subtotal) * 100) : 0,
                grandTotal: sale.total,
                paymentMethod: sale.paymentMethod,
                items: sale.items.map((i) => ({
                  name: i.productName,
                  quantity: i.quantity,
                  unitPrice: i.unitPrice,
                  total: i.quantity * i.unitPrice,
                })),
              });
            };

            return (
              <div
                key={sale.id}
                className="p-3 rounded-2xl bg-stone-850 border border-stone-750 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center font-bold text-amber-400">
                    #{sale.tableNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{sale.tableName}</span>
                      <span className="text-stone-400">• {timeStr}</span>
                      <span className="px-2 py-0.2 rounded bg-stone-800 text-[10px] text-stone-300">
                        {sale.paymentMethod}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400">
                      Mesero: {sale.waiterName} • {sale.items.reduce((s, i) => s + i.quantity, 0)} ítems
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-mono font-bold text-sm text-emerald-400">
                      {formatMXN(sale.total)}
                    </div>
                    <div className="text-[10px] text-stone-400">
                      +{formatMXN(sale.tip)} propina
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={downloadPdfForSale}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 flex items-center gap-1 transition cursor-pointer"
                      title="Descargar Ticket Oficial en PDF"
                    >
                      <span>📄 PDF</span>
                    </button>

                    <button
                      onClick={shareWhatsAppForSale}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 transition cursor-pointer"
                      title="Reenviar ticket por WhatsApp"
                    >
                      <span>📲 WhatsApp</span>
                    </button>

                    <button
                      onClick={shareEmailForSale}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 flex items-center gap-1 transition cursor-pointer"
                      title="Reenviar ticket por Correo"
                    >
                      <span>✉️ Correo</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

