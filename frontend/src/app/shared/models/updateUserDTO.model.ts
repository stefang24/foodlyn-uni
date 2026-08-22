export interface UpdateUserDTO {
    firstName: string | null;
    lastName: string | null;
    email: string;
    username: string;
    role: string;
    restaurantId: number | null;
    restaurantIds: number[];
    isActive: boolean;
}
