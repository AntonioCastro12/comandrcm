import React, { useState, useMemo } from 'react';
import { RestaurantTable, OrderItem } from '../types/restaurant';
import { formatMXN } from '../utils/currency';
import {
  ComandaReportData,
  downloadComandaPDF,
  getComandaPDFBlobUrl,
  shareComandaPDF,
  canShareFiles,
  formatComandaForWhatsApp,
  formatComandaForEmail,
} from '../utils/pdfTicketGenerator';
import { getWhatsAppShareUrl, getEmailShareUrl } from '../utils/ticketFormatter';
import {
  X,
  FileText,
  Download,
  Eye,
  MessageCircle,
  Mail,
  Copy,
  Check,
  Send,
  Share2,
  Printer,
  Sparkles,
  Smartphone,
  Info,
} from 'lucide-react';

interface ComandaReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: RestaurantTable;
  currentCartItems?: OrderItem[];
  waiterName: string;
  tipPercentage?: number;
}

export const ComandaReportModal: React.FC<ComandaReportModalProps> = ({
  isOpen,
  onClose,
  table,
  currentCartItems = [],
  waiterName,
  tipPercentage = 10,
}) => {
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [emailSentNotice, setEmailSentNotice] = useState(false);
  const [pdfDownloadedNotice, setPdfDownloadedNotice] = useState(false);
  const [pdfSharedNotice, setPdfSharedNotice] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  // Consolidar ítems ya enviados en tickets anteriores de la mesa
  const tableDispatchedItems: OrderItem[] = useMemo(() => {
    return table.tickets.flatMap((t) => t.items);
  }, [table.tickets]);

  // Selección de qué comanda ver: 'carrito', 'acumulada_mesa', o 'todo'
  const hasCart = currentCartItems.length > 0;
  const hasDispatched = tableDispatchedItems.length > 0;

  const defaultMode: 'carrito' | 'acumulada_mesa' | 'todo' =
    hasCart ? 'carrito' : hasDispatched ? 'acumulada_mesa' : 'carrito';

  const [scopeMode, setScopeMode] = useState<'carrito' | 'acumulada_mesa' | 'todo'>(defaultMode);

  // Ítems a reportar según el modo seleccionado
  const activeItems: OrderItem[] = useMemo(() => {
    if (scopeMode === 'carrito' && hasCart) {
      return currentCartItems;
    }
    if (scopeMode === 'acumulada_mesa' && hasDispatched) {
      return tableDispatchedItems;
    }
    if (scopeMode === 'todo') {
      return [...tableDispatchedItems, ...currentCartItems];
    }
    return hasCart ? currentCartItems : tableDispatchedItems;
  }, [scopeMode, hasCart, hasDispatched, currentCartItems, tableDispatchedItems]);

  const subtotal = useMemo(() => {
    return activeItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }, [activeItems]);

  const estimatedTip = (subtotal * tipPercentage) / 100;
  const total = subtotal + estimatedTip;

  if (!isOpen) return null;

  const comandaData: ComandaReportData = {
    orderNumber: table.tickets.length > 0 ? table.tickets[table.tickets.length - 1].orderNumber : Math.floor(100 + Math.random() * 899),
    tableName: table.name,
    tableNumber: table.number,
    area: table.area,
    waiterName: table.currentWaiterName || waiterName,
    items: activeItems.map((i) => ({
      id: i.id,
      name: i.productName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      destination: i.destination,
      notes: i.notes,
    })),
    subtotal,
    estimatedTip,
    total,
    dateStr: new Date().toLocaleString('es-MX', {
      dateStyle: 'short',
      timeStyle: 'short',
    }),
  };

  const handleDownloadPDF = () => {
    downloadComandaPDF(comandaData);
    setPdfDownloadedNotice(true);
    setTimeout(() => setPdfDownloadedNotice(false), 3500);
  };

  const handlePreviewPDF = () => {
    const url = getComandaPDFBlobUrl(comandaData);
    setPdfPreviewUrl(url);
  };

  const handleNativeSharePDF = async () => {
    const shared = await shareComandaPDF(comandaData);
    if (shared) {
      setPdfSharedNotice(true);
      setTimeout(() => setPdfSharedNotice(false), 3500);
    } else {
      // Fallback: Si no soporta compartir archivo directo, descargar PDF y abrir WhatsApp
      downloadComandaPDF(comandaData);
      handleSendWhatsApp();
    }
  };

  const handleSendWhatsApp = () => {
    const message = formatComandaForWhatsApp(comandaData);
    const url = getWhatsAppShareUrl(customerPhone, message);
    window.open(url, '_blank');
  };

  const handleSendEmail = () => {
    const subject = `Reporte de Comanda - ${table.name} (ComandaRCM)`;
    const body = formatComandaForEmail(comandaData);
    const mailtoUrl = getEmailShareUrl(customerEmail, subject, body);

    window.location.href = mailtoUrl;
    setEmailSentNotice(true);
    setTimeout(() => setEmailSentNotice(false), 4000);
  };

  const handleCopyText = () => {
    const text = formatComandaForWhatsApp(comandaData);
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const isNativeShareSupported = canShareFiles();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-stone-900 border border-stone-750 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-stone-850 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                Reporte PDF de Comanda • {table.name}
              </h3>
              <p className="text-xs text-stone-400">
                {table.area} • Mesero: {table.currentWaiterName || waiterName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Selector de Ámbito (si hay comanda en carrito Y en mesa) */}
          {hasCart && hasDispatched && (
            <div className="bg-stone-950/70 p-1.5 rounded-xl border border-stone-800 grid grid-cols-3 gap-1 text-xs">
              <button
                type="button"
                onClick={() => setScopeMode('carrito')}
                className={`py-1.5 px-2 rounded-lg font-semibold transition ${
                  scopeMode === 'carrito'
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Carrito Actual ({currentCartItems.reduce((s, i) => s + i.quantity, 0)})
              </button>
              <button
                type="button"
                onClick={() => setScopeMode('acumulada_mesa')}
                className={`py-1.5 px-2 rounded-lg font-semibold transition ${
                  scopeMode === 'acumulada_mesa'
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Mesa Enviada ({tableDispatchedItems.reduce((s, i) => s + i.quantity, 0)})
              </button>
              <button
                type="button"
                onClick={() => setScopeMode('todo')}
                className={`py-1.5 px-2 rounded-lg font-semibold transition ${
                  scopeMode === 'todo'
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Total Mesa ({currentCartItems.reduce((s, i) => s + i.quantity, 0) + tableDispatchedItems.reduce((s, i) => s + i.quantity, 0)})
              </button>
            </div>
          )}

          {/* Resumen Visual de la Comanda (Estilo Ticket Térmico 80mm) */}
          <div className="bg-stone-950/90 border border-stone-800 rounded-2xl p-4 font-mono text-xs space-y-2">
            <div className="text-center pb-2 border-b border-dashed border-stone-800 font-sans">
              <span className="font-black text-amber-400 text-sm tracking-wide">
                RESTAURANTE COMANDARCM
              </span>
              <p className="text-[11px] text-stone-300 font-medium">
                REPORTE DE COMANDA DE SERVICIO
              </p>
              <p className="text-[10px] text-stone-400">
                Mesa: {table.name} ({table.area}) • Mesero: {table.currentWaiterName || waiterName}
              </p>
              <p className="text-[10px] text-stone-500">
                Fecha: {new Date().toLocaleDateString('es-MX')} • Hora: {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {activeItems.length === 0 ? (
              <div className="py-6 text-center text-stone-500 font-sans text-xs">
                No hay productos en la comanda seleccionada para generar reporte.
              </div>
            ) : (
              <div className="space-y-2 py-1 max-h-48 overflow-y-auto pr-1">
                {activeItems.map((item) => (
                  <div key={item.id} className="text-stone-300">
                    <div className="flex justify-between items-start">
                      <span className="font-sans font-medium text-white pr-2">
                        <strong className="text-amber-400 font-mono">{item.quantity}x</strong>{' '}
                        {item.productName}{' '}
                        <span className="text-[10px] text-stone-400">
                          [{item.destination === 'bar' ? 'BAR' : 'COCINA'}]
                        </span>
                      </span>
                      <span className="font-semibold whitespace-nowrap text-stone-300 font-mono">
                        {formatMXN(item.quantity * item.unitPrice)}
                      </span>
                    </div>
                    {item.notes && (
                      <div className="text-[11px] text-amber-300/90 pl-5 italic font-sans">
                        ↳ ⚠️ Nota: {item.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Totales en MXN */}
            {activeItems.length > 0 && (
              <div className="border-t border-dashed border-stone-800 pt-2 space-y-1">
                <div className="flex justify-between text-stone-400">
                  <span>Subtotal ({activeItems.reduce((s, i) => s + i.quantity, 0)} platillos):</span>
                  <span>{formatMXN(subtotal)}</span>
                </div>
                {estimatedTip > 0 && (
                  <div className="flex justify-between text-stone-400">
                    <span>Propina sugerida ({tipPercentage}%):</span>
                    <span>{formatMXN(estimatedTip)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-stone-800 font-sans">
                  <span>Total Estimado (MXN):</span>
                  <span className="text-amber-400 font-black">{formatMXN(total)}</span>
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN 1: COMPARTIR DIRECTO EN DISPOSITIVO / DESCARGA PDF */}
          <div className="bg-stone-850/80 border border-stone-750 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xs text-white uppercase tracking-wider">
                  Acciones Rápidas del PDF
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                Formato Térmico 80mm
              </span>
            </div>

            {/* Botón Principal para Móvil: Compartir PDF Nativo */}
            <button
              type="button"
              onClick={handleNativeSharePDF}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-stone-950 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/30 transition active:scale-[0.98] cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>
                {isNativeShareSupported
                  ? 'Compartir PDF al Dispositivo (WhatsApp / Correo)'
                  : 'Descargar PDF y Enviar por WhatsApp'}
              </span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-stone-800 hover:bg-stone-750 text-white border border-stone-700 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Descargar PDF</span>
              </button>

              <button
                type="button"
                onClick={handlePreviewPDF}
                className="py-2 px-3 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Previsualizar formato térmico"
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>Ver PDF</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="py-2 px-3 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Imprimir comanda"
              >
                <Printer className="w-3.5 h-3.5 text-stone-400" />
                <span>Imprimir</span>
              </button>
            </div>

            {pdfDownloadedNotice && (
              <div className="text-[11px] text-emerald-400 font-semibold animate-in fade-in flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg">
                <Check className="w-3.5 h-3.5" />
                <span>¡Archivo PDF descargado en tu dispositivo!</span>
              </div>
            )}

            {pdfSharedNotice && (
              <div className="text-[11px] text-emerald-400 font-semibold animate-in fade-in flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg">
                <Check className="w-3.5 h-3.5" />
                <span>¡Comanda enviada a través de tu aplicación seleccionada!</span>
              </div>
            )}
          </div>

          {/* SECCIÓN 2: ENVIAR COMANDA DIRECTAMENTE POR WHATSAPP O CORREO */}
          <div className="bg-stone-850/80 border border-stone-750 rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-xs text-white uppercase tracking-wider">
                  Enviar Mensaje desde el Dispositivo
                </span>
              </div>
              <span className="text-[10px] text-stone-400">
                Texto estructurado
              </span>
            </div>

            {/* WhatsApp */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Enviar comanda por WhatsApp:</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-stone-400 pointer-events-none">
                    <span>🇲🇽 +52</span>
                  </div>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="55 1234 5678 (opcional)"
                    className="w-full bg-stone-950 border border-stone-750 rounded-xl pl-16 pr-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-stone-950 flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition active:scale-95 whitespace-nowrap cursor-pointer"
                  title="Abrir WhatsApp con la comanda ya redactada"
                >
                  <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>WhatsApp</span>
                </button>
              </div>
              <p className="text-[10px] text-stone-500">
                Puedes ingresar el número del cliente/cocina o dejarlo vacío para seleccionar el contacto en WhatsApp.
              </p>
            </div>

            {/* Correo Electrónico */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>Enviar comanda por Correo Electrónico:</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="cocina@restaurante.com o cliente@correo.com"
                  className="flex-1 bg-stone-950 border border-stone-750 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleSendEmail}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-500 hover:bg-blue-400 text-stone-950 flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition active:scale-95 whitespace-nowrap cursor-pointer"
                  title="Enviar comanda por correo"
                >
                  <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Correo</span>
                </button>
              </div>

              {emailSentNotice && (
                <p className="text-[11px] text-blue-400 font-medium animate-in fade-in">
                  ✓ Comanda preparada y enviada al gestor de correo electrónico
                </p>
              )}
            </div>

            {/* Copiar texto */}
            <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleCopyText}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-white border border-stone-700 transition cursor-pointer"
              >
                {copiedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">¡Texto Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-stone-400" />
                    <span>Copiar Texto de Comanda</span>
                  </>
                )}
              </button>

              <span className="text-[11px] text-stone-500">
                Moneda: Pesos Mexicanos (MXN)
              </span>
            </div>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl font-semibold text-xs bg-stone-800 hover:bg-stone-750 text-stone-300 transition cursor-pointer"
            >
              Cerrar Ventana
            </button>
          </div>
        </div>
      </div>

      {/* Modal Iframe de Previsualización del PDF de Comanda */}
      {pdfPreviewUrl && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-stone-900 border border-stone-700 rounded-3xl max-w-md w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-3.5 bg-stone-850 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xs text-white">
                  Vista Previa PDF • Comanda {table.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleDownloadPDF}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center gap-1 transition cursor-pointer"
                  title="Descargar PDF"
                >
                  <Download className="w-3 h-3" />
                  <span>Descargar</span>
                </button>
                <button
                  onClick={() => setPdfPreviewUrl(null)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-stone-950 p-2 overflow-hidden">
              <iframe
                src={pdfPreviewUrl}
                title="Vista previa de la comanda PDF"
                className="w-full h-full rounded-2xl border border-stone-850 bg-white"
              />
            </div>

            <div className="p-3 bg-stone-850 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
              <span>Formato oficial de comanda 80mm</span>
              <button
                onClick={() => setPdfPreviewUrl(null)}
                className="px-3 py-1 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
