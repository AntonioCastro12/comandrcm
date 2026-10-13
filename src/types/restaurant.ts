export type ProductCategory = 'entradas' | 'fuertes' | 'bebidas' | 'cocteles' | 'postres';

export type ProductDestination = 'cocina' | 'bar';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  available: boolean;
  destination: ProductDestination;
  prepTimeMinutes: number;
  badge?: string; // e.g. 'Favorito', 'Nuevo', 'Chef'
}

export interface OrderItem {
  id: string; // unique item instance id
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  destination: ProductDestination;
  notes: string;
}

export type TicketStatus = 'enviado' | 'en_preparacion' | 'listo' | 'entregado';

export interface KitchenTicket {
  id: string;
  orderNumber: number;
  tableId: string;
  tableNumber: number;
  tableName: string;
  waiterId: string;
  waiterName: string;
  items: OrderItem[];
  status: TicketStatus;
  destination: 'cocina' | 'bar' | 'mixto';
  createdAt: number;
  startedAt?: number;
  readyAt?: number;
  completedAt?: number;
  completedItemIds: string[]; // for chefs checking off specific dishes
}

export type TableStatus = 'disponible' | 'ocupada' | 'cuenta_pedida';

export interface RestaurantTable {
  id: string;
  number: number;
  name: string;
  area: string;
  capacity: number;
  status: TableStatus;
  currentWaiterId?: string;
  currentWaiterName?: string;
  openedAt?: number;
  tickets: KitchenTicket[];
  shape?: 'cuadrada' | 'redonda' | 'rectangular';
  orderIndex?: number;
}

export interface WaiterProfile {
  id: string;
  name: string;
  nickname: string;
  avatar: string;
  pin: string;
  shift: 'Matutino (08:00 - 16:00)' | 'Vespertino (16:00 - 00:00)' | 'Nocturno (20:00 - 04:00)';
  phone: string;
  avatarColor: string;
  tablesServedToday: number;
  totalSalesToday: number;
  tipsToday: number;
}

export interface SaleRecord {
  id: string;
  tableNumber: number;
  tableName: string;
  waiterId: string;
  waiterName: string;
  items: {
    productId: string;
    productName: string;
    category: ProductCategory;
    quantity: number;
    unitPrice: number;
    destination: ProductDestination;
  }[];
  subtotal: number;
  tip: number;
  total: number;
  timestamp: number;
  paymentMethod: string;
}

export type ActiveScreen = 'waiter' | 'kitchen' | 'tables' | 'menu' | 'profile' | 'sales';
