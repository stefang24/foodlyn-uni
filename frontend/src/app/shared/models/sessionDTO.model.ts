export interface TableSessionCartLineModifierDTO {
    id: number;
    menuItemModifierId: number | null;
    groupName: string;
    name: string;
    price: number;
}

export interface TableSessionCartLineDTO {
    id: number;
    lineKey: string;
    menuItemId: number;
    name: string;
    unitPrice: number;
    quantity: number;
    notes: string | null;
    imageUrl: string | null;
    addedByLabel: string | null;
    modifiers: TableSessionCartLineModifierDTO[];
}

export interface TableSessionDTO {
    id: number;
    restaurantId: number;
    tableId: number;
    tableNumber: number;
    tableLabel: string | null;
    partySize: number;
    ownerKind: 'Guest' | 'User';
    ownerUserId: number | null;
    status: 'Open' | 'Closed';
    openedAt: string;
    cartLines: TableSessionCartLineDTO[];
}

export interface ScanResultDTO {
    restaurantId: number;
    tableId: number;
    tableNumber: number;
    tableLabel: string | null;
    restaurantName: string;
    restaurantLogoUrl: string | null;
    existingSession: TableSessionDTO | null;
    isOwnerOfExisting: boolean;
    blockedByOtherUser: boolean;
    shouldLogoutForGuestJoin: boolean;
    blockedByActiveOrder: boolean;
    joinableOrderId: number | null;
    myActiveOrderId: number | null;
}

export interface TableAccessDTO {
    restaurantId: number;
    tableId: number;
    hasOpenSession: boolean;
    sessionOwnerKind: 'User' | 'Guest' | null;
    isSessionMember: boolean;
    blockedByOtherUser: boolean;
    blockedByActiveOrder: boolean;
    canStartFresh: boolean;
    joinableOrderId: number | null;
}

export interface ScanQrDTO {
    qrToken: string;
    customerLatitude: number | null;
    customerLongitude: number | null;
}

export interface StartSessionDTO {
    qrToken: string;
    customerLatitude: number | null;
    customerLongitude: number | null;
    asGuest: boolean;
    partySize: number;
}

export interface AddCartLineDTO {
    menuItemId: number;
    quantity: number;
    notes: string | null;
    modifierIds: number[];
}
