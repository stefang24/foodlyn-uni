export interface SystemLogDTO {
    id: number;
    createdAt: string;
    updatedAt: string | null;
    level: string;
    statusCode: number | null;
    message: string;
    exceptionType: string | null;
    stackTrace: string | null;
    path: string | null;
    method: string | null;
    queryString: string | null;
    userId: number | null;
    username: string | null;
    userRole: string | null;
    restaurantId: number | null;
    ipAddress: string | null;
    userAgent: string | null;
    source: string | null;
}
