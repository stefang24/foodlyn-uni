export interface UserDTO {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
    username: string;
    role: string;
    restaurantId: number | null;
    restaurantIds: number[];
    isActive: boolean;
    createdAt: string;
    lastLoginAt: string | null;
    profilePictureUrl: string | null;
}
