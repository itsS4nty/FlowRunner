/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server as SocketIOServer, Socket } from 'socket.io';
import Koa from 'koa';
import serve from 'koa-static';
import { createServer } from 'http';
import path from 'path';

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
    private app: Koa;
    private server: any;
    private handlers = new Map<FRONTEND_EVENTS, EventHandler<any>>();

    constructor(handlerOnConnection: () => DashboardPayload, port = 3001) {
        // Setup Koa app to serve dashboard assets
        this.app = new Koa();

        // Try to serve dashboard assets if they exist
        try {
            const dashboardPath = path.resolve(__dirname, '..', 'dashboard');

            this.app.use(serve(dashboardPath));
            console.log(`[Dashboard] Serving dashboard assets from: ${dashboardPath}`);
        } catch (error) {
            console.warn(
                '[Dashboard] Dashboard assets not found, dashboard UI will not be available',
            );
        }

        // Create HTTP server
        this.server = createServer(this.app.callback());

        // Setup Socket.IO
        this.io = new SocketIOServer(this.server, {
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

        this.server.listen(port, () => {
            console.log(`[Dashboard] Server running on http://localhost:${port}`);
        });

        if (this.server && typeof this.server.on === 'function') {
            this.server.on('error', (err: any) => {
                if (err.code === 'EADDRINUSE') {
                    console.error(`[Dashboard] Port ${port} is already in use. Please use a different port or stop the service using port ${port}.`);
                    console.error(`[Dashboard] You can specify a different port: new FlowRunner({ dashboardPort: ${port + 1} })`);
                } else {
                    console.error('[Dashboard] Server error:', err);
                }
                throw err;
            });
        }
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

    close() {
        if (this.server) {
            this.server.close();
        }
        if (this.io) {
            this.io.close();
        }
    }
}
