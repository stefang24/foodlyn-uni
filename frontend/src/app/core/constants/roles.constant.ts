export const ROLES = {
    SUPER_ADMIN: 'SuperAdmin',
    MANAGER: 'Manager',
    COOK: 'Cook',
    WAITER: 'Waiter',
    CASHIER: 'Cashier',
    STATUS_DISPLAY: 'StatusDisplay',
    GUEST: 'Guest',
    USER: 'User',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
