export type RestaurantTableStatus =
    | 'Free'
    | 'Occupied'
    | 'Eating'
    | 'Reserved'
    | 'Cleaning'
    | 'OutOfService';

export interface RestaurantTableDTO {
    id: number;
    restaurantId: number | null;
    number: number;
    label: string | null;
    capacity: number;
    location: string | null;
    notes: string | null;
    status: RestaurantTableStatus;
    currentPartySize: number;
    occupiedSince: string | null;
    qrToken: string;
    qrTokenRotatedAt: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string | null;
}

export interface CreateRestaurantTableDTO {
    restaurantId: number;
    number: number;
    label: string | null;
    capacity: number;
    location: string | null;
    notes: string | null;
    isActive: boolean;
}

export interface BulkCreateRestaurantTablesDTO {
    restaurantId: number;
    count: number;
    startingNumber: number;
    capacity: number;
    location: string | null;
}

export interface UpdateRestaurantTableDTO {
    number: number;
    label: string | null;
    capacity: number;
    location: string | null;
    notes: string | null;
    status: RestaurantTableStatus;
    currentPartySize: number;
    isActive: boolean;
}

export interface TableQrResolveDTO {
    tableId: number;
    tableNumber: number;
    tableLabel: string | null;
    restaurantId: number;
    restaurantName: string;
    restaurantSlug: string;
    restaurantLogoUrl: string | null;
    currency: string | null;
}
