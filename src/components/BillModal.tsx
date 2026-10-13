import React, { useState } from 'react';
import { RestaurantTable } from '../types/restaurant';
import { useRestaurant } from '../context/RestaurantContext';
import { formatMXN } from '../utils/currency';
import {
  formatTicketForWhatsApp,
  formatTicketForEmailBody,
  getWhatsAppShareUrl,
  getEmailShareUrl,
  TicketData,
} from '../utils/ticketFormatter';
import { downloadTicketPDF, getTicketPDFBlobUrl } from '../utils/pdfTicketGenerator';
import {
  X,
  Receipt,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  Printer,
  Copy,
  Check,
  Send,
  MessageCircle,
  Mail,
  Share2,
  Sparkles,
  FileText,
  Download,
  Eye,
} from 'lucide-react';

interface BillModalProps {
  table: RestaurantTable;
  onClose: () => void;
}

export const BillModal: React.FC<BillModalProps> = ({ table, onClose }) => {
  const { settleTableBill, activeWaiter } = useRestaurant();

  const [paymentMethod, setPaymentMethod] = useState<'Tarjeta' | 'Efectivo' | 'QR / Móvil'>('Tarjeta');
  const [tipPercentage, setTipPercentage] = useState<number>(10);
  const [isSettled, setIsSettled] = useState(false);

  // Digital Delivery States
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [emailSentNotice, setEmailSentNotice] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfDownloadedNotice, setPdfDownloadedNotice] = useState(false);

  // Consolidate all items across tickets for this table
  const allTickets = table.tickets;
  const itemsMap: Record<
    string,
    { name: string; quantity: number; unitPrice: number; total: number }
  > = {};

  allTickets.forEach((ticket) => {
    ticket.items.forEach((item) => {
      if (!itemsMap[item.productId]) {
        itemsMap[item.productId] = {
          name: item.productName,
          quantity: 0,
          unitPrice: item.unitPrice,
          total: 0,
        };
      }
      itemsMap[item.productId].quantity += item.quantity;
      itemsMap[item.productId].total += item.quantity * item.unitPrice;
    });
  });

  const consolidatedItems = Object.values(itemsMap);
  const subtotal = consolidatedItems.reduce((acc, i) => acc + i.total, 0);
  const tax = subtotal * 0.16; // 16% IVA México
  const tip = (subtotal * tipPercentage) / 100;
  const grandTotal = subtotal + tip;

  const ticketData: TicketData = {
    restaurantName: 'ComandaRCM',
    tableName: table.name,
    tableNumber: table.number,
    area: table.area,
    waiterName: table.currentWaiterName || activeWaiter.name,
    items: consolidatedItems,
    subtotal,
    tax,
    tip,
    tipPercentage,
    grandTotal,
    paymentMethod,
  };

  const handlePayAndFreeTable = () => {
    settleTableBill(table.id, tip);
    setIsSettled(true);
    setShowSharePanel(true);
  };

  const handleSendWhatsApp = () => {
    const message = formatTicketForWhatsApp(ticketData);
    const url = getWhatsAppShareUrl(customerPhone, message);
    window.open(url, '_blank');
  };

  const handleSendEmail = () => {
    const subject = `Tu Ticket de Consumo en ComandaRCM - ${table.name}`;
    const body = formatTicketForEmailBody(ticketData);
    const mailtoUrl = getEmailShareUrl(customerEmail, subject, body);

    // Open mail client
    window.location.href = mailtoUrl;

    setEmailSentNotice(true);
    setTimeout(() => {
      setEmailSentNotice(false);
    }, 4000);
  };

  const handleCopyTicketText = () => {
    const text = formatTicketForWhatsApp(ticketData);
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => {
      setCopiedSuccess(false);
    }, 3000);
  };

  const handleDownloadPDF = () => {
    downloadTicketPDF(ticketData);
    setPdfDownloadedNotice(true);
    setTimeout(() => {
      setPdfDownloadedNotice(false);
    }, 3500);
  };

  const handlePreviewPDF = () => {
    const url = getTicketPDFBlobUrl(ticketData);
    setPdfPreviewUrl(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-stone-900 border border-stone-750 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-stone-850 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {isSettled ? 'Ticket Cobrado' : 'Cuenta & Cobro'} - {table.name}
              </h3>
              <p className="text-xs text-stone-400">
                {table.area} • Atendido por: {table.currentWaiterName || activeWaiter.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Mensaje de Cobro Exitoso si ya se pagó */}
          {isSettled && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 flex items-center gap-3 text-emerald-200 animate-in fade-in">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-white">¡Mesa cobrada y liberada con éxito!</div>
                <div className="text-emerald-300/90 text-[11px]">
                  Total: {formatMXN(grandTotal)} ({paymentMethod}). Ya puedes enviar el ticket digital al cliente:
                </div>
              </div>
            </div>
          )}

          {/* Ticket de Consumo Estilo Térmico Digital */}
          <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-4 font-mono text-xs space-y-2">
            <div className="text-center pb-2 border-b border-dashed border-stone-800 font-sans">
              <span className="font-black text-amber-400 text-sm tracking-wide">
                RESTAURANTE COMANDARCM
              </span>
              <p className="text-[11px] text-stone-400">
                Ticket de Consumo • {table.name}
              </p>
              <p className="text-[10px] text-stone-400">
                Mesero: {table.currentWaiterName || activeWaiter.name} • {new Date().toLocaleDateString('es-MX')}
              </p>
            </div>

            <div className="space-y-1.5 py-1">
              {consolidatedItems.length === 0 ? (
                <p className="text-stone-500 text-center py-2">No hay consumos registrados.</p>
              ) : (
                consolidatedItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-stone-300">
                    <span className="truncate pr-2">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-semibold whitespace-nowrap">{formatMXN(item.total)}</span>
                  </div>
                ))
              )}
            </div>

            {/* Totales */}
            <div className="border-t border-dashed border-stone-800 pt-2 space-y-1">
              <div className="flex justify-between text-stone-400">
                <span>Subtotal:</span>
                <span>{formatMXN(subtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>IVA (16% incluido):</span>
                <span>{formatMXN(tax)}</span>
              </div>
              <div className="flex justify-between text-amber-300">
                <span>Propina ({tipPercentage}%):</span>
                <span>{formatMXN(tip)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-white pt-1.5 border-t border-stone-800 font-sans">
                <span>Total:</span>
                <span className="text-amber-400 font-black">{formatMXN(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* SECCIÓN PRINCIPAL: ENVIAR TICKET DIGITAL A WHATSAPP O CORREO */}
          <div className="bg-stone-850/80 border border-stone-750 rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-xs text-white uppercase tracking-wider">
                  Enviar Ticket al Cliente
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                Sin papel • Digital
              </span>
            </div>

            {/* Opción 1: WhatsApp */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Enviar por WhatsApp:</span>
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
                    placeholder="55 1234 5678"
                    className="w-full bg-stone-950 border border-stone-750 rounded-xl pl-16 pr-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-stone-950 flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition active:scale-95 whitespace-nowrap cursor-pointer"
                  title="Abrir WhatsApp con el ticket ya redactado"
                >
                  <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Opción 2: Correo Electrónico */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>Enviar por Correo Electrónico:</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="cliente@correo.com"
                  className="flex-1 bg-stone-950 border border-stone-750 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleSendEmail}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-500 hover:bg-blue-400 text-stone-950 flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition active:scale-95 whitespace-nowrap cursor-pointer"
                  title="Enviar ticket por email"
                >
                  <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Correo</span>
                </button>
              </div>

              {emailSentNotice && (
                <p className="text-[11px] text-blue-400 font-medium animate-in fade-in">
                  ✓ Ticket preparado y enviado al gestor de correo
                </p>
              )}
            </div>

            {/* Acciones de PDF, Copia e Impresión */}
            <div className="pt-2 border-t border-stone-800 space-y-2">
              {/* Fila Principal de PDF */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                  title="Descargar archivo PDF oficial del ticket"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Ticket en PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handlePreviewPDF}
                  className="py-2 px-3 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  title="Ver formato térmico del PDF"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ver PDF</span>
                </button>
              </div>

              {pdfDownloadedNotice && (
                <div className="text-[11px] text-emerald-400 font-semibold animate-in fade-in flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg">
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Archivo PDF descargado! Listo para compartir o archivar.</span>
                </div>
              )}

              {/* Fila Secundaria: Copiar Texto o Imprimir */}
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={handleCopyTicketText}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-white border border-stone-700 transition"
                >
                  {copiedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-stone-400" />
                      <span>Copiar Texto</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-white border border-stone-700 transition"
                >
                  <Printer className="w-3.5 h-3.5 text-stone-400" />
                  <span>Imprimir</span>
                </button>
              </div>
            </div>
          </div>

          {/* Si aún NO ha cobrado: Selector de Propina, Método y Botón de Cobro */}
          {!isSettled && (
            <div className="space-y-3.5 pt-1">
              {/* Selector de Propina */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Propina para el mesero:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setTipPercentage(pct)}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${
                        tipPercentage === pct
                          ? 'bg-amber-500 border-amber-400 text-stone-950 shadow'
                          : 'bg-stone-850 border-stone-750 text-stone-300 hover:bg-stone-800'
                      }`}
                    >
                      {pct === 0 ? '0%' : `${pct}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Método de Pago */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Método de pago:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Tarjeta')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs font-semibold transition ${
                      paymentMethod === 'Tarjeta'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-stone-850 border-stone-750 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Tarjeta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Efectivo')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs font-semibold transition ${
                      paymentMethod === 'Efectivo'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-stone-850 border-stone-750 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Efectivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('QR / Móvil')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs font-semibold transition ${
                      paymentMethod === 'QR / Móvil'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-stone-850 border-stone-750 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>QR / Móvil</span>
                  </button>
                </div>
              </div>

              {/* Botón de Cobro Definitivo */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handlePayAndFreeTable}
                  className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Cobrar {formatMXN(grandTotal)} y Liberar Mesa</span>
                </button>
              </div>
            </div>
          )}

          {/* Botón Finalizar si ya se cobró */}
          {isSettled && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl font-bold text-xs bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 transition"
              >
                Listo • Cerrar Ventana y Continuar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Previsualización del PDF Térmico */}
      {pdfPreviewUrl && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-stone-900 border border-stone-700 rounded-3xl max-w-md w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-3.5 bg-stone-850 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xs text-white">
                  Vista Previa PDF • Ticket {table.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleDownloadPDF}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center gap-1 transition"
                  title="Descargar PDF"
                >
                  <Download className="w-3 h-3" />
                  <span>Descargar</span>
                </button>
                <button
                  onClick={() => setPdfPreviewUrl(null)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-stone-950 p-2 overflow-hidden">
              <iframe
                src={pdfPreviewUrl}
                title="Vista previa del ticket PDF"
                className="w-full h-full rounded-2xl border border-stone-850 bg-white"
              />
            </div>

            <div className="p-3 bg-stone-850 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
              <span>Formato oficial térmico 80mm</span>
              <button
                onClick={() => setPdfPreviewUrl(null)}
                className="px-3 py-1 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 font-semibold"
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
