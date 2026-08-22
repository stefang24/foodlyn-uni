import { Injectable, signal } from '@angular/core';
import {
    HubConnection,
    HubConnectionBuilder,
    HubConnectionState,
    LogLevel,
} from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OrderDTO } from '../models/orderDTO.model';
import { NotificationDTO } from '../models/notificationDTO.model';
import { TableSessionDTO } from '../models/sessionDTO.model';
import { TableLobbyDTO } from '../models/tableLobbyDTO.model';
import { TableCallDTO } from './table.service';

export type StaffGroup = 'cashier' | 'kitchen' | 'waiter' | 'manager' | 'statusDisplay';

export interface TableStatusUpdate {
    id: number;
    status: string;
    currentPartySize: number;
}

const RETRY_DELAYS_MS = [2000, 5000, 10000, 20000, 30000];

@Injectable({ providedIn: 'root' })
export class OrderRealtimeService {
    private connection: HubConnection | null = null;
    private connectPromise: Promise<void> | null = null;
    private retryHandle: ReturnType<typeof setTimeout> | null = null;
    private retryAttempt = 0;
    private stopped = false;

    private readonly joinedOrders = new Set<number>();
    private readonly joinedSessions = new Set<number>();
    private readonly joinedTables = new Set<number>();
    private readonly joinedTableOrders = new Set<number>();
    private readonly joinedStaff = new Set<string>();

    readonly state = signal<HubConnectionState>(HubConnectionState.Disconnected);

    readonly created$ = new Subject<OrderDTO>();
    readonly updated$ = new Subject<OrderDTO>();
    readonly removed$ = new Subject<number>();
    readonly waiterCalled$ = new Subject<TableCallDTO>();
    readonly waiterCallRemoved$ = new Subject<number>();
    readonly tableStatusChanged$ = new Subject<TableStatusUpdate>();
    readonly notificationCreated$ = new Subject<NotificationDTO>();
    readonly sessionCartUpdated$ = new Subject<TableSessionDTO>();
    readonly sessionClosed$ = new Subject<number>();
    readonly tableLobbyChanged$ = new Subject<TableLobbyDTO>();
    readonly tableLobbyCleared$ = new Subject<number>();
    readonly reconnected$ = new Subject<void>();

    private ensureConnection(): Promise<void> {
        if (this.connection && this.connection.state === HubConnectionState.Connected) {
            return Promise.resolve();
        }
        if (this.connectPromise) return this.connectPromise;

        this.stopped = false;
        this.clearRetry();

        const hubUrl = environment.apiUrl.replace(/\/api\/?$/, '') + '/hubs/orders';
        this.connection = new HubConnectionBuilder()
            .withUrl(hubUrl, { withCredentials: true })
            .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
            .configureLogging(LogLevel.Warning)
            .build();

        this.connection.on('orderCreated', (o: OrderDTO) => this.created$.next(o));
        this.connection.on('orderUpdated', (o: OrderDTO) => this.updated$.next(o));
        this.connection.on('orderRemoved', (id: number) => this.removed$.next(id));
        this.connection.on('waiterCalled', (c: TableCallDTO) => this.waiterCalled$.next(c));
        this.connection.on('waiterCallRemoved', (id: number) =>
            this.waiterCallRemoved$.next(id),
        );
        this.connection.on('tableStatusChanged', (u: TableStatusUpdate) =>
            this.tableStatusChanged$.next(u),
        );
        this.connection.on('notificationCreated', (n: NotificationDTO) =>
            this.notificationCreated$.next(n),
        );
        this.connection.on('sessionCartUpdated', (s: TableSessionDTO) =>
            this.sessionCartUpdated$.next(s),
        );
        this.connection.on('sessionClosed', (id: number) =>
            this.sessionClosed$.next(id),
        );
        this.connection.on('tableLobbyChanged', (s: TableLobbyDTO) =>
            this.tableLobbyChanged$.next(s),
        );
        this.connection.on('tableLobbyCleared', (id: number) =>
            this.tableLobbyCleared$.next(id),
        );

        this.connection.onreconnected(() => {
            this.state.set(HubConnectionState.Connected);
            this.retryAttempt = 0;
            void this.rejoinAllGroups().then(() => this.reconnected$.next());
        });
        this.connection.onreconnecting(() => this.state.set(HubConnectionState.Reconnecting));
        this.connection.onclose(() => {
            this.state.set(HubConnectionState.Disconnected);
            this.connection = null;
            this.connectPromise = null;
            if (!this.stopped && this.hasJoinedGroups()) {
                this.scheduleRetry();
            }
        });

        this.connectPromise = this.connection
            .start()
            .then(() => {
                this.state.set(HubConnectionState.Connected);
                this.retryAttempt = 0;
            })
            .catch((err) => {
                this.connectPromise = null;
                this.connection = null;
                this.state.set(HubConnectionState.Disconnected);
                if (!this.stopped) this.scheduleRetry();
                throw err;
            });
        return this.connectPromise;
    }

    private hasJoinedGroups(): boolean {
        return (
            this.joinedOrders.size > 0 ||
            this.joinedSessions.size > 0 ||
            this.joinedTables.size > 0 ||
            this.joinedTableOrders.size > 0 ||
            this.joinedStaff.size > 0
        );
    }

    private scheduleRetry(): void {
        if (this.retryHandle) return;
        const delay = RETRY_DELAYS_MS[Math.min(this.retryAttempt, RETRY_DELAYS_MS.length - 1)];
        this.retryAttempt++;
        this.retryHandle = setTimeout(() => {
            this.retryHandle = null;
            if (this.stopped) return;
            this.ensureConnection()
                .then(() => this.rejoinAllGroups())
                .then(() => this.reconnected$.next())
                .catch(() => {});
        }, delay);
    }

    private clearRetry(): void {
        if (this.retryHandle) {
            clearTimeout(this.retryHandle);
            this.retryHandle = null;
        }
    }

    private async rejoinAllGroups(): Promise<void> {
        if (!this.connection || this.connection.state !== HubConnectionState.Connected) return;
        const invokes: Promise<unknown>[] = [];
        for (const orderId of this.joinedOrders) {
            invokes.push(this.connection.invoke('JoinOrderGroup', orderId).catch(() => {}));
        }
        for (const sessionId of this.joinedSessions) {
            invokes.push(this.connection.invoke('JoinSessionGroup', sessionId).catch(() => {}));
        }
        for (const tableId of this.joinedTables) {
            invokes.push(this.connection.invoke('JoinTableGroup', tableId).catch(() => {}));
        }
        for (const tableId of this.joinedTableOrders) {
            invokes.push(this.connection.invoke('JoinTableOrdersGroup', tableId).catch(() => {}));
        }
        for (const key of this.joinedStaff) {
            const [group, restaurantId] = key.split(':');
            invokes.push(
                this.connection
                    .invoke('JoinStaffGroup', group, Number(restaurantId))
                    .catch(() => {}),
            );
        }
        await Promise.all(invokes);
    }

    async start(): Promise<void> {
        await this.ensureConnection();
    }

    async joinOrder(orderId: number): Promise<void> {
        this.joinedOrders.add(orderId);
        await this.ensureConnection();
        await this.connection!.invoke('JoinOrderGroup', orderId);
    }

    async leaveOrder(orderId: number): Promise<void> {
        this.joinedOrders.delete(orderId);
        if (!this.connection) return;
        try {
            await this.connection.invoke('LeaveOrderGroup', orderId);
        } catch {
        }
    }

    async joinSession(sessionId: number): Promise<void> {
        this.joinedSessions.add(sessionId);
        await this.ensureConnection();
        await this.connection!.invoke('JoinSessionGroup', sessionId);
    }

    async leaveSession(sessionId: number): Promise<void> {
        this.joinedSessions.delete(sessionId);
        if (!this.connection) return;
        try {
            await this.connection.invoke('LeaveSessionGroup', sessionId);
        } catch {
        }
    }

    async joinTable(tableId: number): Promise<void> {
        this.joinedTables.add(tableId);
        await this.ensureConnection();
        await this.connection!.invoke('JoinTableGroup', tableId);
    }

    async leaveTable(tableId: number): Promise<void> {
        this.joinedTables.delete(tableId);
        if (!this.connection) return;
        try {
            await this.connection.invoke('LeaveTableGroup', tableId);
        } catch {
        }
    }

    async joinTableOrders(tableId: number): Promise<void> {
        this.joinedTableOrders.add(tableId);
        await this.ensureConnection();
        await this.connection!.invoke('JoinTableOrdersGroup', tableId);
    }

    async leaveTableOrders(tableId: number): Promise<void> {
        this.joinedTableOrders.delete(tableId);
        if (!this.connection) return;
        try {
            await this.connection.invoke('LeaveTableOrdersGroup', tableId);
        } catch {
        }
    }

    async joinStaff(group: StaffGroup, restaurantId: number): Promise<void> {
        this.joinedStaff.add(`${group}:${restaurantId}`);
        await this.ensureConnection();
        await this.connection!.invoke('JoinStaffGroup', group, restaurantId);
    }

    async leaveStaff(group: StaffGroup, restaurantId: number): Promise<void> {
        this.joinedStaff.delete(`${group}:${restaurantId}`);
        if (!this.connection) return;
        try {
            await this.connection.invoke('LeaveStaffGroup', group, restaurantId);
        } catch {
        }
    }

    async stop(): Promise<void> {
        this.stopped = true;
        this.clearRetry();
        this.retryAttempt = 0;
        this.joinedOrders.clear();
        this.joinedSessions.clear();
        this.joinedTables.clear();
        this.joinedTableOrders.clear();
        this.joinedStaff.clear();
        if (!this.connection) return;
        try {
            await this.connection.stop();
        } catch {
        }
        this.connection = null;
        this.connectPromise = null;
        this.state.set(HubConnectionState.Disconnected);
    }
}
