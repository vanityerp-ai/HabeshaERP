"use client"

import React, { createContext, useContext, useState, useEffect, useMemo } from "react"
import { Order, OrderStatus, OrderFilter, OrderNotification, TrackingInfo } from "./order-types"
import { OrderManagementService } from "./order-management-service"
import { Transaction, TransactionStatus } from "./transaction-types"
import { useTransactions } from "./transaction-provider"
import { useAuth } from "./auth-provider"

interface OrderContextType {
  orders: Order[];
  notifications: OrderNotification[];
  getOrder: (orderId: string) => Order | null;
  filterOrders: (filter: OrderFilter) => Order[];
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    tracking?: Partial<TrackingInfo>,
    notes?: string,
    updatedBy?: string
  ) => Order | null;
  createOrderFromTransaction: (transaction: Transaction) => Order | null;
  markNotificationAsRead: (notificationId: string) => void;
  acknowledgeNotification: (notificationId: string) => void;
  getUnreadNotificationCount: () => number;
  getUnacknowledgedNotificationCount: () => number;
  refreshOrders: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([]);
  const [allNotifications, setAllNotifications] = useState<OrderNotification[]>([]);
  const [orderService] = useState(() => OrderManagementService.getInstance());

  // Initialize orders and notifications
  useEffect(() => {
    const initialOrders = orderService.getAllOrders();
    const initialNotifications = orderService.getNotifications();

    setOrders(initialOrders);
    setAllNotifications(initialNotifications);

    // Subscribe to order updates
    const unsubscribeOrders = orderService.subscribe((updatedOrders) => {
      setOrders(updatedOrders);
    });

    // Subscribe to notification updates
    const unsubscribeNotifications = orderService.subscribeToNotifications((updatedNotifications) => {
      setAllNotifications(updatedNotifications);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeNotifications();
    };
  }, [orderService]);

  // Filter notifications based on user role
  // Staff users should NOT receive online order notifications
  // Only Receptionist, Admin, Super Admin, and Manager should receive them
  const notifications = useMemo(() => {
    if (!user) {
      return []
    }

    const userRole = user.role.toUpperCase()
    const isAdminRole = userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "ORG_ADMIN"
    const isManagerRole = userRole === "MANAGER" || userRole === "LOCATION_MANAGER"
    const isReceptionistRole = userRole === "RECEPTIONIST"
    const isStaffRole = userRole === "STAFF"

    // Staff users don't receive any order notifications
    if (isStaffRole) {
      console.log(`🔕 Filtering out all order notifications for staff user ${user.id}`)
      return []
    }

    // Admin, Manager, and Receptionist receive ALL order notifications
    if (isAdminRole || isManagerRole || isReceptionistRole) {
      return allNotifications
    }

    // Other roles don't receive order notifications
    return []
  }, [allNotifications, user]);

  // Set up transaction update callback
  const TransactionUpdateWrapper = ({ children }: { children: React.ReactNode }) => {
    const { updateTransaction } = useTransactions();

    useEffect(() => {
      // Set up callback to update transaction status when order status changes
      orderService.setTransactionUpdateCallback((transactionId: string, status: TransactionStatus) => {
        console.log('🔄 OrderProvider: Updating transaction status', { transactionId, status });
        updateTransaction(transactionId, { status });
      });
    }, [updateTransaction]);

    return <>{children}</>;
  };

  const getOrder = (orderId: string): Order | null => {
    return orderService.getOrder(orderId);
  };

  const filterOrders = (filter: OrderFilter): Order[] => {
    return orderService.filterOrders(filter);
  };

  const updateOrderStatus = (
    orderId: string,
    status: OrderStatus,
    tracking?: Partial<TrackingInfo>,
    notes?: string,
    updatedBy?: string
  ): Order | null => {
    return orderService.updateOrderStatus(orderId, status, tracking, notes, updatedBy);
  };

  const createOrderFromTransaction = (transaction: Transaction): Order | null => {
    return orderService.createOrderFromTransaction(transaction);
  };

  const markNotificationAsRead = (notificationId: string): void => {
    orderService.markNotificationAsRead(notificationId);
  };

  const acknowledgeNotification = (notificationId: string): void => {
    orderService.acknowledgeNotification(notificationId);
  };

  const getUnreadNotificationCount = (): number => {
    return notifications.filter(n => !n.read).length;
  };

  const getUnacknowledgedNotificationCount = (): number => {
    return notifications.filter(n => !n.acknowledged).length;
  };

  const refreshOrders = (): void => {
    const updatedOrders = orderService.getAllOrders();
    const updatedNotifications = orderService.getNotifications();
    setOrders(updatedOrders);
    setNotifications(updatedNotifications);
  };

  const value = {
    orders,
    notifications,
    getOrder,
    filterOrders,
    updateOrderStatus,
    createOrderFromTransaction,
    markNotificationAsRead,
    acknowledgeNotification,
    getUnreadNotificationCount,
    getUnacknowledgedNotificationCount,
    refreshOrders
  };

  return (
    <OrderContext.Provider value={value}>
      <TransactionUpdateWrapper>
        {children}
      </TransactionUpdateWrapper>
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}
