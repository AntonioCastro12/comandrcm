import jsPDF from 'jspdf';
import { TicketData } from './ticketFormatter';
import { formatMXN } from './currency';

/**
 * Genera un PDF profesional estilo ticket térmico (80mm)
 */
export function generateTicketPDF(data: TicketData): jsPDF {
  // Calculamos la altura requerida según la cantidad de platillos
  const baseHeight = 120; // cabecera + totales + pie
  const itemsHeight = data.items.length * 9;
  const totalHeight = Math.max(160, baseHeight + itemsHeight);

  // Formato ticket térmico: 80mm de ancho por totalHeight mm de alto
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, totalHeight],
  });

  const pageWidth = 80;
  let y = 10;

  // 1. Cabecera del Restaurante
  doc.setFont('courier', 'bold');
  doc.setFontSize(13);
  doc.text('RESTAURANTE COMANDARCM', pageWidth / 2, y, { align: 'center' });
  y += 5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.text('Sistema de Comanda & Control Móvil', pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.text('RFC: RCM-261013-MX9', pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.text('Av. Insurgentes Sur #450, CDMX, México', pageWidth / 2, y, { align: 'center' });
  y += 5;

  // Línea punteada
  doc.text('----------------------------------------', pageWidth / 2, y, { align: 'center' });
  y += 4;

  // 2. Metadatos de la mesa y fecha
  doc.setFontSize(8);
  const now = data.dateStr || new Date().toLocaleString('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const folio = Math.floor(1000 + (data.tableNumber * 37) + (data.subtotal % 899));

  doc.text(`TICKET FOLIO: #${folio}`, 6, y);
  y += 4;
  doc.text(`FECHA / HORA: ${now}`, 6, y);
  y += 4;
  doc.text(`MESA: ${data.tableName.toUpperCase()} (${data.area || 'Salón'})`, 6, y);
  y += 4;
  doc.text(`MESERO: ${data.waiterName.toUpperCase()}`, 6, y);
  y += 4;

  // Línea divisoria
  doc.text('----------------------------------------', pageWidth / 2, y, { align: 'center' });
  y += 4;

  // 3. Encabezado de columnas
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.text('CANT  DESCRIPCIÓN', 6, y);
  doc.text('IMPORTE', pageWidth - 6, y, { align: 'right' });
  y += 3.5;

  doc.setFont('courier', 'normal');
  doc.text('----------------------------------------', pageWidth / 2, y, { align: 'center' });
  y += 4;

  // 4. Lista de platillos y bebidas
  doc.setFontSize(7.5);
  data.items.forEach((item) => {
    // Truncar nombre si es muy largo para que no se encime
    let truncatedName = item.name;
    if (truncatedName.length > 22) {
      truncatedName = truncatedName.substring(0, 20) + '..';
    }

    doc.text(`${item.quantity}x   ${truncatedName}`, 6, y);
    doc.text(formatMXN(item.total), pageWidth - 6, y, { align: 'right' });
    y += 4.5;
  });

  // Línea divisoria
  y += 1;
  doc.text('----------------------------------------', pageWidth / 2, y, { align: 'center' });
  y += 4.5;

  // 5. Totales e impuestos
  doc.text('SUBTOTAL:', 6, y);
  doc.text(formatMXN(data.subtotal), pageWidth - 6, y, { align: 'right' });
  y += 4;

  doc.text('IVA (16% INCLUIDO):', 6, y);
  doc.text(formatMXN(data.tax), pageWidth - 6, y, { align: 'right' });
  y += 4;

  if (data.tip > 0) {
    doc.text(`PROPINA SUGERIDA (${data.tipPercentage}%):`, 6, y);
    doc.text(formatMXN(data.tip), pageWidth - 6, y, { align: 'right' });
    y += 4;
  }

  // TOTAL PAGADO EN GRANDE
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  y += 1;
  doc.text('TOTAL A PAGAR:', 6, y);
  doc.text(formatMXN(data.grandTotal), pageWidth - 6, y, { align: 'right' });
  y += 5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.text(`MÉTODO DE PAGO: ${data.paymentMethod.toUpperCase()}`, 6, y);
  y += 5;

  // Línea divisoria
  doc.text('----------------------------------------', pageWidth / 2, y, { align: 'center' });
  y += 5;

  // 6. Pie de ticket y agradecimiento
  doc.setFontSize(7.5);
  doc.text('¡GRACIAS POR SU PREFERENCIA!', pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.text('Comprobante digital para el cliente', pageWidth / 2, y, { align: 'center' });
  y += 3.5;
  doc.text('www.comandarcm.rest', pageWidth / 2, y, { align: 'center' });

  return doc;
}

/**
 * Descarga directamente el archivo PDF
 */
export function downloadTicketPDF(data: TicketData): void {
  const doc = generateTicketPDF(data);
  const cleanTableName = data.tableName.replace(/\s+/g, '_');
  const filename = `Ticket_ComandaRCM_${cleanTableName}_${Date.now().toString().slice(-4)}.pdf`;
  doc.save(filename);
}

/**
 * Obtiene la URL blob para previsualizar el PDF en un iframe o visor
 */
export function getTicketPDFBlobUrl(data: TicketData): string {
  const doc = generateTicketPDF(data);
  return doc.output('bloburl').toString();
}

export interface ComandaItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  destination: 'cocina' | 'bar';
  notes?: string;
}

export interface ComandaReportData {
  orderNumber?: number;
  tableName: string;
  tableNumber: number;
  area?: string;
  waiterName: string;
  items: ComandaItem[];
  subtotal: number;
  estimatedTip?: number;
  total?: number;
  dateStr?: string;
}

/**
 * Genera PDF de la Comanda Actual (para el mesero, cocina o cliente)
 */
export function generateComandaPDF(data: ComandaReportData): jsPDF {
  // Calculamos altura dinámica según ítems y notas
  const notesCount = data.items.filter((i) => Boolean(i.notes)).length;
  const baseHeight = 110;
  const itemsHeight = data.items.length * 8 + notesCount * 6;
  const totalHeight = Math.max(150, baseHeight + itemsHeight);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, totalHeight],
  });

  const pageWidth = 80;
  let y = 10;

  // Cabecera
  doc.setFont('courier', 'bold');
  doc.setFontSize(12);
  doc.text('COMANDARCM - REPORTE DE COMANDA', pageWidth / 2, y, { align: 'center' });
  y += 5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.text('ORDEN ACTIVA DE SERVICIO', pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.text('----------------------------------------', pageWidth / 2, y, { align: 'center' });
  y += 4;

  const now = data.dateStr || new Date().toLocaleString('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const orderNum = data.orderNumber || Math.floor(100 + Math.random() * 899);

  doc.text(`ORDEN / COMANDA: #${orderNum}`, 6, y);
  y += 4;
  doc.text(`MESA: ${data.tableName.toUpperCase()} (${data.area || 'Salón'})`, 6, y);
  y += 4;
  doc.text(`MESERO: ${data.waiterName.toUpperCase()}`, 6, y);
  y += 4;
  doc.text(`FECHA / HORA: ${now}`, 6, y);
  y += 4;
  doc.text('----------------------------------------', pageWidth / 2, y, { align: 'center' });
  y += 4;

  // Encabezado
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.text('CANT  PLATILLO / ESPECIFICACIÓN', 6, y);
  doc.text('DESTINO', pageWidth - 6, y, { align: 'right' });
  y += 3.5;
  doc.setFont('courier', 'normal');
  doc.text('----------------------------------------', pageWidth / 2, y, { align: 'center' });
  y += 4;

  // Items
  doc.setFontSize(7.5);
  data.items.forEach((item) => {
    let name = item.name;
    if (name.length > 18) {
      name = name.substring(0, 16) + '..';
    }
    const dest = item.destination === 'bar' ? 'BAR' : 'COCINA';
    const lineTotal = item.unitPrice ? formatMXN(item.quantity * item.unitPrice) : dest;

    doc.text(`${item.quantity}x ${name} [${dest}]`, 6, y);
    doc.text(lineTotal, pageWidth - 6, y, { align: 'right' });
    y += 4;

    // Nota especial destacada
    if (item.notes) {
      doc.setFont('courier', 'bold');
      doc.text(`   * NOTA: ${item.notes.substring(0, 28)}`, 6, y);
      doc.setFont('courier', 'normal');
      y += 4;
    }
  });

  y += 2;
  doc.text('----------------------------------------', pageWidth / 2, y, { align: 'center' });
  y += 4;

  // Totales estimados
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.text('SUBTOTAL ESTIMADO:', 6, y);
  doc.text(formatMXN(data.subtotal), pageWidth - 6, y, { align: 'right' });
  y += 4.5;

  if (data.estimatedTip && data.estimatedTip > 0) {
    doc.text('PROPINA SUGERIDA:', 6, y);
    doc.text(formatMXN(data.estimatedTip), pageWidth - 6, y, { align: 'right' });
    y += 4.5;
  }

  if (data.total) {
    doc.text('TOTAL ESTIMADO:', 6, y);
    doc.text(formatMXN(data.total), pageWidth - 6, y, { align: 'right' });
    y += 5;
  }

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.text('----------------------------------------', pageWidth / 2, y, { align: 'center' });
  y += 4.5;
  doc.text('Reporte de Comanda para Cocina & Mesa', pageWidth / 2, y, { align: 'center' });
  y += 3.5;
  doc.text('ComandaRCM Movil • Mexico', pageWidth / 2, y, { align: 'center' });

  return doc;
}

export function downloadComandaPDF(data: ComandaReportData): void {
  const doc = generateComandaPDF(data);
  const cleanTableName = data.tableName.replace(/\s+/g, '_');
  const filename = `Comanda_${cleanTableName}_${Date.now().toString().slice(-4)}.pdf`;
  doc.save(filename);
}

export function getComandaPDFBlobUrl(data: ComandaReportData): string {
  const doc = generateComandaPDF(data);
  return doc.output('bloburl').toString();
}

/**
 * Crea un objeto File del PDF para Web Share API
 */
export function createComandaPDFFile(data: ComandaReportData): File {
  const doc = generateComandaPDF(data);
  const blob = doc.output('blob');
  const cleanTableName = data.tableName.replace(/\s+/g, '_');
  const filename = `Comanda_${cleanTableName}.pdf`;
  return new File([blob], filename, { type: 'application/pdf' });
}

/**
 * Verifica si el dispositivo soporta compartir archivos nativamente (ej. WhatsApp, Mail en Android/iOS)
 */
export function canShareFiles(): boolean {
  if (typeof navigator === 'undefined' || !navigator.canShare) return false;
  try {
    const testFile = new File([new Blob(['test'], { type: 'application/pdf' })], 'test.pdf', {
      type: 'application/pdf',
    });
    return navigator.canShare({ files: [testFile] });
  } catch {
    return false;
  }
}

/**
 * Comparte el archivo PDF directamente al menú nativo del dispositivo (WhatsApp, Correo, etc.)
 */
export async function shareComandaPDF(data: ComandaReportData): Promise<boolean> {
  const file = createComandaPDFFile(data);
  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `Comanda ${data.tableName} - ComandaRCM`,
        text: `Reporte de comanda para ${data.tableName} (Atendido por ${data.waiterName})`,
      });
      return true;
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        console.error('Error sharing comanda PDF:', e);
      }
      return false;
    }
  }
  return false;
}

/**
 * Formateo de la comanda actual para enviar a WhatsApp
 */
export function formatComandaForWhatsApp(data: ComandaReportData): string {
  const now = data.dateStr || new Date().toLocaleString('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  const lines = [
    `📋 *REPORTE DE COMANDA - COMANDARCM*`,
    `🪑 Mesa: *${data.tableName}*`,
    `👨‍🍳 Mesero: ${data.waiterName}`,
    `🕒 Hora: ${now}`,
    `----------------------------------------`,
    `*PLATILLOS PEDIDOS:*`,
  ];

  data.items.forEach((item) => {
    const destEmoji = item.destination === 'bar' ? '🍹 Bar' : '🔥 Cocina';
    lines.push(`• *${item.quantity}x* ${item.name} (${destEmoji}) - ${formatMXN(item.quantity * item.unitPrice)}`);
    if (item.notes) {
      lines.push(`  ↳ ⚠️ _Nota: ${item.notes}_`);
    }
  });

  lines.push(`----------------------------------------`);
  lines.push(`*SUBTOTAL ESTIMADO:* ${formatMXN(data.subtotal)}`);
  if (data.estimatedTip && data.estimatedTip > 0) {
    lines.push(`*PROPINA SUGERIDA:* ${formatMXN(data.estimatedTip)}`);
  }
  if (data.total) {
    lines.push(`*TOTAL ESTIMADO:* ${formatMXN(data.total)}`);
  }
  lines.push(`----------------------------------------`);
  lines.push(`✨ Enviado desde ComandaRCM Móvil`);

  return lines.join('\n');
}

/**
 * Formateo de la comanda actual para enviar por Correo
 */
export function formatComandaForEmail(data: ComandaReportData): string {
  return formatComandaForWhatsApp(data).replace(/\*/g, '').replace(/_/g, '');
}

