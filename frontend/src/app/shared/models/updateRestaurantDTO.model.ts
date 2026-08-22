export interface UpdateRestaurantDTO {
    name?: string | null;

    description: string | null;
    email: string | null;
    phoneNumber: string | null;
    website: string | null;

    streetAddress: string | null;
    city: string | null;
    postalCode: string | null;
    country: string | null;
    latitude: number | null;
    longitude: number | null;

    logoUrl: string | null;
    coverImageUrl: string | null;

    currency: string | null;
    timeZone: string | null;
    cuisine: string | null;
    openingHours: string | null;
    taxId: string | null;
    isActive?: boolean | null;
}
