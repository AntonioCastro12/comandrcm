import { formatMXN } from './currency';

export interface TicketData {
  restaurantName?: string;
  tableName: string;
  tableNumber: number;
  area?: string;
  waiterName: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  tip: number;
  tipPercentage: number;
  grandTotal: number;
  paymentMethod: string;
  dateStr?: string;
}

/**
 * Genera el texto formateado optimizado para WhatsApp con emojis y negritas
 */
export function formatTicketForWhatsApp(data: TicketData): string {
  const date = data.dateStr || new Date().toLocaleString('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  const lines = [
    `🧾 *TICKET DE CONSUMO - ${data.restaurantName || 'ComandaRCM'}*`,
    `📍 Mesa: *${data.tableName}*`,
    `👨‍🍳 Atendido por: ${data.waiterName}`,
    `🕒 Fecha: ${date}`,
    `----------------------------------------`,
    `*CONSUMO:*`,
  ];

  data.items.forEach((item) => {
    lines.push(`• ${item.quantity}x ${item.name} - ${formatMXN(item.total)}`);
  });

  lines.push(`----------------------------------------`);
  lines.push(`Subtotal: ${formatMXN(data.subtotal)}`);
  lines.push(`IVA (16% inc): ${formatMXN(data.tax)}`);
  if (data.tip > 0) {
    lines.push(`Propina (${data.tipPercentage}%): ${formatMXN(data.tip)}`);
  }
  lines.push(`*TOTAL PAGADO: ${formatMXN(data.grandTotal)}*`);
  lines.push(`💳 Método de pago: ${data.paymentMethod}`);
  lines.push(`----------------------------------------`);
  lines.push(`✨ ¡Muchas gracias por su visita a ComandaRCM!`);

  return lines.join('\n');
}

/**
 * Genera el cuerpo de correo para mailto:
 */
export function formatTicketForEmailBody(data: TicketData): string {
  return formatTicketForWhatsApp(data).replace(/\*/g, '');
}

/**
 * Enlace directo de WhatsApp Web / App
 */
export function getWhatsAppShareUrl(phoneNumber: string, message: string): string {
  // Limpia el número telefónico para conservar solo dígitos
  let cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // Si tiene 10 dígitos (número estándar mexicano), agregar prefijo de país 52
  if (cleanNumber.length === 10) {
    cleanNumber = `52${cleanNumber}`;
  }

  const encodedMessage = encodeURIComponent(message);
  if (cleanNumber) {
    return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
  }
  return `https://wa.me/?text=${encodedMessage}`;
}

/**
 * Enlace mailto para cliente de correo
 */
export function getEmailShareUrl(email: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}
