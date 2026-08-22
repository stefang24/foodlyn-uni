export interface RegisterDTO {
    firstName: string | null;
    lastName: string | null;
    email: string;
    password: string;
    username: string;
    confirmPassword: string;
    role: string;
    restaurantId: number;
}
