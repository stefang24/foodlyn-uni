export interface NotificationDTO {
    id: number;
    userId: number;
    restaurantId: number | null;
    type: string;
    title: string;
    body: string | null;
    data: string | null;
    isRead: boolean;
    readAt: string | null;
    createdAt: string;
}

export interface PagedNotificationsDTO {
    items: NotificationDTO[];
    totalCount: number;
    page: number;
    pageSize: number;
}
