import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Product,
  RestaurantTable,
  WaiterProfile,
  OrderItem,
  KitchenTicket,
  TicketStatus,
  ActiveScreen,
  SaleRecord,
} from '../types/restaurant';
import { INITIAL_PRODUCTS, INITIAL_TABLES, INITIAL_WAITERS, INITIAL_SALES_RECORDS } from '../utils/initialData';
import { playBellChime, playReadyChime, playSoftClick } from '../utils/audio';

import { formatMXN } from '../utils/currency';

interface NotificationMessage {
  id: string;
  title: string;
  message: string;
  type: 'order_sent' | 'kitchen_ready' | 'info';
  timestamp: number;
}

interface RestaurantContextType {
  // Screens & Nav
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  soundMuted: boolean;
  setSoundMuted: (muted: boolean | ((prev: boolean) => boolean)) => void;

  // Waiter Profile
  waiters: WaiterProfile[];
  activeWaiter: WaiterProfile;
  setActiveWaiterId: (id: string) => void;
  updateActiveWaiter: (updates: Partial<WaiterProfile>) => void;
  createNewWaiter: (waiter: Omit<WaiterProfile, 'id' | 'tablesServedToday' | 'totalSalesToday' | 'tipsToday'>) => void;

  // Products / Menu
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProductAvailability: (id: string) => void;

  // Tables
  tables: RestaurantTable[];
  selectedTableId: string;
  setSelectedTableId: (tableId: string) => void;
  selectedTable: RestaurantTable | undefined;
  requestTableBill: (tableId: string) => void;
  settleTableBill: (tableId: string, tipAmount: number) => void;
  changeTableStatus: (tableId: string, status: RestaurantTable['status']) => void;
  addTable: (table: { number: number; name: string; area: string; capacity: number; shape?: RestaurantTable['shape'] }) => void;
  updateTable: (id: string, updates: Partial<RestaurantTable>) => void;
  deleteTable: (id: string) => void;
  moveTableOrder: (tableId: string, direction: 'up' | 'down') => void;

  // Cart / Order Pad
  currentCart: OrderItem[];
  addToCart: (product: Product, quantity?: number, notes?: string) => void;
  updateCartItemQuantity: (itemId: string, delta: number) => void;
  updateCartItemNotes: (itemId: string, notes: string) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  sendOrderToKitchen: () => boolean;

  // KDS / Kitchen
  kitchenTickets: KitchenTicket[];
  updateTicketStatus: (tableId: string, ticketId: string, newStatus: TicketStatus) => void;
  toggleTicketItemCompleted: (tableId: string, ticketId: string, itemId: string) => void;

  // Sales & Reports
  salesRecords: SaleRecord[];

  // Notifications
  notifications: NotificationMessage[];
  dismissNotification: (id: string) => void;
  triggerQuickDemoOrder: () => void;
  resetToDemoData: () => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'comanda_pro_products_mxn_v2',
  TABLES: 'comanda_pro_tables_mxn_v2',
  WAITERS: 'comanda_pro_waiters_mxn_v2',
  ACTIVE_WAITER_ID: 'comanda_pro_active_waiter_id_mxn_v2',
  SOUND_MUTED: 'comanda_pro_sound_muted_mxn_v2',
  SALES_RECORDS: 'comanda_pro_sales_records_mxn_v2',
};

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('waiter');
  
  // Sound toggle
  const [soundMuted, setSoundMuted] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SOUND_MUTED);
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Waiters
  const [waiters, setWaiters] = useState<WaiterProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WAITERS);
      return saved ? JSON.parse(saved) : INITIAL_WAITERS;
    } catch {
      return INITIAL_WAITERS;
    }
  });

  const [activeWaiterId, setActiveWaiterIdState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_WAITER_ID);
      return saved || 'waiter-1';
    } catch {
      return 'waiter-1';
    }
  });

  // Products
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  // Tables
  const [tables, setTables] = useState<RestaurantTable[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TABLES);
      return saved ? JSON.parse(saved) : INITIAL_TABLES;
    } catch {
      return INITIAL_TABLES;
    }
  });

  // Selected Table
  const [selectedTableId, setSelectedTableId] = useState<string>('table-1');

  // Active Cart for current order creation
  const [currentCart, setCurrentCart] = useState<OrderItem[]>([]);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);

  // Persist sound
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SOUND_MUTED, JSON.stringify(soundMuted));
    } catch {
      // ignore
    }
  }, [soundMuted]);

  // Persist Products
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch {
      // ignore
    }
  }, [products]);

  // Persist Tables
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(tables));
    } catch {
      // ignore
    }
  }, [tables]);

  // Sales Records
  const [salesRecords, setSalesRecords] = useState<SaleRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SALES_RECORDS);
      return saved ? JSON.parse(saved) : INITIAL_SALES_RECORDS;
    } catch {
      return INITIAL_SALES_RECORDS;
    }
  });

  // Persist Waiters
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WAITERS, JSON.stringify(waiters));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_WAITER_ID, activeWaiterId);
    } catch {
      // ignore
    }
  }, [waiters, activeWaiterId]);

  // Persist Sales
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SALES_RECORDS, JSON.stringify(salesRecords));
    } catch {
      // ignore
    }
  }, [salesRecords]);

  const activeWaiter = useMemo(() => {
    return waiters.find((w) => w.id === activeWaiterId) || waiters[0];
  }, [waiters, activeWaiterId]);

  const selectedTable = useMemo(() => {
    return tables.find((t) => t.id === selectedTableId);
  }, [tables, selectedTableId]);

  // All kitchen & bar tickets across tables
  const kitchenTickets = useMemo(() => {
    const list: KitchenTicket[] = [];
    tables.forEach((t) => {
      t.tickets.forEach((ticket) => {
        list.push(ticket);
      });
    });
    // Sort newest tickets or active ones first
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }, [tables]);

  const pushNotification = (title: string, message: string, type: 'order_sent' | 'kitchen_ready' | 'info') => {
    const newNotif: NotificationMessage = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      type,
      timestamp: Date.now(),
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 4)]);

    // Auto dismiss after 7 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== newNotif.id));
    }, 7000);
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const setActiveWaiterId = (id: string) => {
    setActiveWaiterIdState(id);
    playSoftClick(soundMuted);
  };

  const updateActiveWaiter = (updates: Partial<WaiterProfile>) => {
    setWaiters((prev) =>
      prev.map((w) => (w.id === activeWaiter.id ? { ...w, ...updates } : w))
    );
  };

  const createNewWaiter = (waiterData: Omit<WaiterProfile, 'id' | 'tablesServedToday' | 'totalSalesToday' | 'tipsToday'>) => {
    const newId = `waiter-${Date.now()}`;
    const newWaiter: WaiterProfile = {
      ...waiterData,
      id: newId,
      tablesServedToday: 0,
      totalSalesToday: 0,
      tipsToday: 0,
    };
    setWaiters((prev) => [...prev, newWaiter]);
    setActiveWaiterIdState(newId);
    pushNotification('Nuevo Mesero Creado', `Bienvenido al equipo, ${newWaiter.name}`, 'info');
  };

  // Products CRUD
  const addProduct = (productData: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [newProd, ...prev]);
    pushNotification('Producto Agregado', `"${newProd.name}" ya está en el menú.`, 'info');
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const deleteProduct = (id: string) => {
    const target = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (target) {
      pushNotification('Producto Eliminado', `"${target.name}" ha sido retirado del menú.`, 'info');
    }
  };

  const toggleProductAvailability = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newStatus = !p.available;
          pushNotification(
            newStatus ? 'Platillo Disponible' : 'Platillo Agotado (86)',
            `${p.name} marcado como ${newStatus ? 'disponible' : 'agotado en cocina'}.`,
            'info'
          );
          return { ...p, available: newStatus };
        }
        return p;
      })
    );
  };

  // Cart operations
  const addToCart = (product: Product, quantity = 1, notes = '') => {
    playSoftClick(soundMuted);
    setCurrentCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id && item.notes === notes);
      if (existing) {
        return prev.map((item) =>
          item.id === existing.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      const newItem: OrderItem = {
        id: `cart-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        destination: product.destination,
        notes,
      };
      return [...prev, newItem];
    });
  };

  const updateCartItemQuantity = (itemId: string, delta: number) => {
    playSoftClick(soundMuted);
    setCurrentCart((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is OrderItem => item !== null)
    );
  };

  const updateCartItemNotes = (itemId: string, notes: string) => {
    setCurrentCart((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, notes } : item))
    );
  };

  const removeFromCart = (itemId: string) => {
    playSoftClick(soundMuted);
    setCurrentCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const clearCart = () => {
    setCurrentCart([]);
  };

  // Send Order to Kitchen
  const sendOrderToKitchen = (): boolean => {
    if (!selectedTable || currentCart.length === 0) return false;

    // Check destinations
    const hasKitchen = currentCart.some((i) => i.destination === 'cocina');
    const hasBar = currentCart.some((i) => i.destination === 'bar');
    const destinationType: 'cocina' | 'bar' | 'mixto' =
      hasKitchen && hasBar ? 'mixto' : hasBar ? 'bar' : 'cocina';

    const orderNumber = Math.floor(100 + Math.random() * 899);

    const newTicket: KitchenTicket = {
      id: `ticket-${Date.now()}`,
      orderNumber,
      tableId: selectedTable.id,
      tableNumber: selectedTable.number,
      tableName: selectedTable.name,
      waiterId: activeWaiter.id,
      waiterName: activeWaiter.name,
      items: [...currentCart],
      status: 'enviado',
      destination: destinationType,
      createdAt: Date.now(),
      completedItemIds: [],
    };

    // Update table
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === selectedTable.id) {
          const wasAvailable = t.status === 'disponible';
          return {
            ...t,
            status: 'ocupada',
            currentWaiterId: activeWaiter.id,
            currentWaiterName: activeWaiter.name,
            openedAt: wasAvailable ? Date.now() : t.openedAt,
            tickets: [...t.tickets, newTicket],
          };
        }
        return t;
      })
    );

    // Play ringing chime
    playBellChime(soundMuted);

    pushNotification(
      `Comanda #${orderNumber} Enviada a Cocina`,
      `${currentCart.reduce((acc, i) => acc + i.quantity, 0)} artículos enviados para ${selectedTable.name}.`,
      'order_sent'
    );

    clearCart();
    return true;
  };

  // Ticket status advancement
  const updateTicketStatus = (tableId: string, ticketId: string, newStatus: TicketStatus) => {
    setTables((prev) =>
      prev.map((table) => {
        if (table.id === tableId) {
          return {
            ...table,
            tickets: table.tickets.map((ticket) => {
              if (ticket.id === ticketId) {
                const now = Date.now();
                return {
                  ...ticket,
                  status: newStatus,
                  startedAt: newStatus === 'en_preparacion' && !ticket.startedAt ? now : ticket.startedAt,
                  readyAt: newStatus === 'listo' ? now : ticket.readyAt,
                  completedAt: newStatus === 'entregado' ? now : ticket.completedAt,
                };
              }
              return ticket;
            }),
          };
        }
        return table;
      })
    );

    // If marked ready: play bell & notify waiter
    if (newStatus === 'listo') {
      playReadyChime(soundMuted);
      const targetTable = tables.find((t) => t.id === tableId);
      const ticket = targetTable?.tickets.find((tk) => tk.id === ticketId);
      pushNotification(
        `🔔 ¡Comanda Lista en Cocina!`,
        `Pedido #${ticket?.orderNumber || ''} de ${targetTable?.name || 'Mesa'} listo para servir.`,
        'kitchen_ready'
      );
    } else {
      playSoftClick(soundMuted);
    }
  };

  const toggleTicketItemCompleted = (tableId: string, ticketId: string, itemId: string) => {
    setTables((prev) =>
      prev.map((table) => {
        if (table.id === tableId) {
          return {
            ...table,
            tickets: table.tickets.map((ticket) => {
              if (ticket.id === ticketId) {
                const isCompleted = ticket.completedItemIds.includes(itemId);
                const updatedCompleted = isCompleted
                  ? ticket.completedItemIds.filter((id) => id !== itemId)
                  : [...ticket.completedItemIds, itemId];
                return {
                  ...ticket,
                  completedItemIds: updatedCompleted,
                };
              }
              return ticket;
            }),
          };
        }
        return table;
      })
    );
    playSoftClick(soundMuted);
  };

  const changeTableStatus = (tableId: string, status: RestaurantTable['status']) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, status } : t))
    );
  };

  const requestTableBill = (tableId: string) => {
    changeTableStatus(tableId, 'cuenta_pedida');
    const table = tables.find((t) => t.id === tableId);
    pushNotification('Cuenta Solicitada', `${table?.name || 'Mesa'} ha pedido la cuenta.`, 'info');
  };

  const addTable = (tableData: {
    number: number;
    name: string;
    area: string;
    capacity: number;
    shape?: RestaurantTable['shape'];
  }) => {
    const newId = `table-${Date.now()}`;
    const newTable: RestaurantTable = {
      id: newId,
      number: tableData.number,
      name: tableData.name.trim(),
      area: tableData.area.trim(),
      capacity: tableData.capacity,
      shape: tableData.shape || 'cuadrada',
      status: 'disponible',
      tickets: [],
    };
    setTables((prev) => [...prev, newTable]);
    pushNotification('Mesa Creada', `"${newTable.name}" agregada a ${newTable.area}.`, 'info');
  };

  const updateTable = (id: string, updates: Partial<RestaurantTable>) => {
    setTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    pushNotification('Mesa Actualizada', `Cambios de la mesa guardados con éxito.`, 'info');
  };

  const deleteTable = (id: string) => {
    const target = tables.find((t) => t.id === id);
    setTables((prev) => prev.filter((t) => t.id !== id));
    if (selectedTableId === id) {
      const remaining = tables.filter((t) => t.id !== id);
      if (remaining.length > 0) {
        setSelectedTableId(remaining[0].id);
      }
    }
    if (target) {
      pushNotification('Mesa Eliminada', `"${target.name}" ha sido retirada del salón.`, 'info');
    }
  };

  const moveTableOrder = (tableId: string, direction: 'up' | 'down') => {
    setTables((prev) => {
      const index = prev.findIndex((t) => t.id === tableId);
      if (index === -1) return prev;
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === prev.length - 1) return prev;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      const newArr = [...prev];
      const temp = newArr[index];
      newArr[index] = newArr[targetIndex];
      newArr[targetIndex] = temp;
      return newArr;
    });
  };

  const settleTableBill = (tableId: string, tipAmount: number) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;

    // Calculate total
    const totalOrderAmount = table.tickets.reduce((acc, ticket) => {
      return (
        acc +
        ticket.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
      );
    }, 0);

    // Record sale for daily dashboard
    const itemsSold: SaleRecord['items'] = [];
    table.tickets.forEach((ticket) => {
      ticket.items.forEach((it) => {
        const prod = products.find((p) => p.id === it.productId);
        itemsSold.push({
          productId: it.productId,
          productName: it.productName,
          category: prod?.category || 'fuertes',
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          destination: it.destination,
        });
      });
    });

    const newSaleRecord: SaleRecord = {
      id: `sale-${Date.now()}`,
      tableNumber: table.number,
      tableName: table.name,
      waiterId: table.currentWaiterId || activeWaiter.id,
      waiterName: table.currentWaiterName || activeWaiter.name,
      timestamp: Date.now(),
      subtotal: totalOrderAmount,
      tip: tipAmount,
      total: totalOrderAmount + tipAmount,
      paymentMethod: 'Tarjeta',
      items: itemsSold,
    };
    setSalesRecords((prev) => [newSaleRecord, ...prev]);

    // Update active waiter metrics
    setWaiters((prev) =>
      prev.map((w) => {
        if (w.id === activeWaiter.id) {
          return {
            ...w,
            tablesServedToday: w.tablesServedToday + 1,
            totalSalesToday: Number((w.totalSalesToday + totalOrderAmount).toFixed(2)),
            tipsToday: Number((w.tipsToday + tipAmount).toFixed(2)),
          };
        }
        return w;
      })
    );

    // Reset table
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === tableId) {
          return {
            ...t,
            status: 'disponible',
            currentWaiterId: undefined,
            currentWaiterName: undefined,
            openedAt: undefined,
            tickets: [],
          };
        }
        return t;
      })
    );

    pushNotification(
      'Mesa Cobrada y Liberada',
      `${table.name} cerró cuenta de ${formatMXN(totalOrderAmount + tipAmount)}. ¡Mesa lista para nuevos clientes!`,
      'info'
    );
  };

  const triggerQuickDemoOrder = () => {
    // Pick first available table or mesa 2
    const target = tables.find((t) => t.status === 'disponible') || tables[1];
    setSelectedTableId(target.id);
    
    // Add two random products
    const sample1 = products[0];
    const sample2 = products[4] || products[1];
    setCurrentCart([
      {
        id: `cart-demo-1-${Date.now()}`,
        productId: sample1.id,
        productName: sample1.name,
        quantity: 2,
        unitPrice: sample1.price,
        destination: sample1.destination,
        notes: 'Sin picante',
      },
      {
        id: `cart-demo-2-${Date.now()}`,
        productId: sample2.id,
        productName: sample2.name,
        quantity: 1,
        unitPrice: sample2.price,
        destination: sample2.destination,
        notes: 'Bien cocido',
      },
    ]);
    setActiveScreen('waiter');
    pushNotification('Comanda de Demostración Cargada', `Se cargó una orden lista en ${target.name}. Toca "Enviar a Cocina".`, 'info');
  };

  const resetToDemoData = () => {
    setProducts(INITIAL_PRODUCTS);
    setTables(INITIAL_TABLES);
    setWaiters(INITIAL_WAITERS);
    setSalesRecords(INITIAL_SALES_RECORDS);
    setActiveWaiterIdState('waiter-1');
    setCurrentCart([]);
    setSelectedTableId('table-1');
    pushNotification('Datos Reiniciados', 'La app se restauró a su estado original de demostración.', 'info');
  };

  return (
    <RestaurantContext.Provider
      value={{
        activeScreen,
        setActiveScreen,
        soundMuted,
        setSoundMuted,
        waiters,
        activeWaiter,
        setActiveWaiterId,
        updateActiveWaiter,
        createNewWaiter,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductAvailability,
        tables,
        selectedTableId,
        setSelectedTableId,
        selectedTable,
        requestTableBill,
        settleTableBill,
        changeTableStatus,
        addTable,
        updateTable,
        deleteTable,
        moveTableOrder,
        currentCart,
        addToCart,
        updateCartItemQuantity,
        updateCartItemNotes,
        removeFromCart,
        clearCart,
        sendOrderToKitchen,
        kitchenTickets,
        updateTicketStatus,
        toggleTicketItemCompleted,
        salesRecords,
        notifications,
        dismissNotification,
        triggerQuickDemoOrder,
        resetToDemoData,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};
