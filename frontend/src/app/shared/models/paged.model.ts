export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface PagedQuery {
    page?: number;
    pageSize?: number;
    search?: string | null;
    sortBy?: string | null;
    sortDir?: 'asc' | 'desc' | null;
}

export interface PagedUserQuery extends PagedQuery {
    role?: string | null;
    isActive?: boolean | null;
    restaurantId?: number | null;
}

export interface PagedRestaurantQuery extends PagedQuery {
    isActive?: boolean | null;
    cuisine?: string | null;
    city?: string | null;
}

export function pagedQueryToParams(q: PagedQuery): Record<string, string> {
    const params: Record<string, string> = {};
    for (const [key, val] of Object.entries(q as Record<string, unknown>)) {
        if (val === null || val === undefined || val === '') continue;
        params[key] = String(val);
    }
    return params;
}
