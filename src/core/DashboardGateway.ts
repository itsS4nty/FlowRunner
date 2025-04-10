/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server as SocketIOServer, Socket } from 'socket.io';

type EVENTS = 'tasks:data' | 'tasks:all';

type FRONTEND_EVENTS_MAP = {
    'task:retry': string;
};
type FRONTEND_EVENTS = keyof FRONTEND_EVENTS_MAP;
type EventHandler<K extends FRONTEND_EVENTS> = (data: FRONTEND_EVENTS_MAP[K]) => void;

type DashboardPayload = {
    allTasks: unknown[];
    stats: unknown;
};

export class DashboardGateway {
    private io: SocketIOServer;
    private handlers = new Map<FRONTEND_EVENTS, EventHandler<any>>();

    constructor(handlerOnConnection: () => DashboardPayload) {
        this.io = new SocketIOServer(3030, {
            cors: { origin: '*' },
        });

        this.io.on('connection', (socket: Socket) => {
            console.log(`[Dashboard] Client connected: ${socket.id}`);
            const { allTasks, stats } = handlerOnConnection();
            socket.emit('tasks:all', allTasks);
            socket.emit('tasks:data', stats);

            for (const [event, handler] of this.handlers.entries()) {
                socket.on(event, data => {
                    console.log(`[Dashboard] Received event: ${event}`, data);
                    handler(data);
                });
            }

            socket.on('disconnect', () => {
                console.log(`[Dashboard] Client disconnected: ${socket.id}`);
            });
        });
    }

    sendData<T = unknown>(event: EVENTS, data: T) {
        if (!this.io) {
            console.error('[Dashboard] Socket server is not initialized');
            return;
        }
        this.io.emit(event, data);
    }

    registerHandler<K extends FRONTEND_EVENTS>(event: K, handler: EventHandler<K>) {
        this.handlers.set(event, handler as any);
    }
}
