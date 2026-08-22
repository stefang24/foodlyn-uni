export type TableLobbyStage = 'Choice' | 'PartySize' | 'Menu' | 'Tracking';

export interface TableLobbyDTO {
    tableId: number;
    restaurantId: number;
    stage: TableLobbyStage;
    sessionId: number | null;
    orderId: number | null;
    qrToken: string | null;
}

export interface AdvanceLobbyDTO {
    stage: TableLobbyStage;
    sessionId?: number | null;
    orderId?: number | null;
    qrToken?: string | null;
}
