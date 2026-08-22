export type OrderStatus =
    | 'Placed'
    | 'Approved'
    | 'Rejected'
    | 'Preparing'
    | 'Ready'
    | 'Served'
    | 'Cancelled'
    | 'AwaitingPayment'
    | 'Completed';

export type PaymentMethod = 'Card' | 'Cash';

export interface OrderItemModifierDTO {
    id: number;
    menuItemModifierId: number | null;
    groupName: string;
    name: string;
    price: number;
}

export interface OrderItemDTO {
    id: number;
    orderId: number;
    menuItemId: number;
    name: string;
    price: number;
    quantity: number;
    notes: string | null;
    modifiers: OrderItemModifierDTO[];
}

export interface OrderDTO {
    id: number;
    restaurantId: number | null;
    tableId: number;
    tableNumber: number;
    tableLabel: string | null;
    sessionId: string | null;
    customerName: string | null;
    status: OrderStatus;
    deliveryNotes: string | null;
    totalAmount: number;
    currency: string | null;
    partySize: number;

    prepTimeMinutes: number | null;
    approvedAt: string | null;
    rejectedAt: string | null;
    rejectedReason: string | null;
    preparingStartedAt: string | null;
    readyAt: string | null;
    servedAt: string | null;
    cancelledAt: string | null;
    paidAt: string | null;
    completedAt: string | null;
    paymentMethod: PaymentMethod | null;

    createdAt: string;
    updatedAt: string | null;
    createdBy: number | null;

    customerUsername: string | null;
    customerFullName: string | null;

    items: OrderItemDTO[];
}

export interface CreateOrderItemDTO {
    menuItemId: number;
    quantity: number;
    notes: string | null;
    modifierIds: number[];
}

export interface CreateOrderDTO {
    tableId: number;
    sessionId: number | null;
    deliveryNotes: string | null;
    customerName: string | null;
    partySize: number;
    paymentMethod: PaymentMethod | null;
    items: CreateOrderItemDTO[];
}

export interface StartPreparingDTO {
    prepTimeMinutes: number;
}

export interface RejectOrderDTO {
    reason: string | null;
}
