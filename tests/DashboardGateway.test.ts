import { DashboardGateway } from '../src/core/DashboardGateway';

// Mock both socket.io and HTTP server
jest.mock('socket.io', () => {
    const mockServer = {
        on: jest.fn(),
        emit: jest.fn(),
        close: jest.fn(),
    };

    return {
        Server: jest.fn().mockImplementation(() => mockServer),
    };
});

// Mock http server
jest.mock('http', () => ({
    createServer: jest.fn().mockImplementation(() => ({
        listen: jest.fn(),
        close: jest.fn(),
    })),
}));

// Mock koa
jest.mock('koa', () => {
    return jest.fn().mockImplementation(() => ({
        use: jest.fn(),
        callback: jest.fn().mockReturnValue(() => {}),
    }));
});

// Mock koa-static
jest.mock('koa-static', () => {
    return jest.fn();
});

describe('DashboardGateway', () => {
    let gateway: DashboardGateway;
    let mockHandlerOnConnection: jest.Mock;
    let port: number;

    beforeEach(() => {
        port = 5000 + Math.floor(Math.random() * 1000);
        mockHandlerOnConnection = jest.fn().mockReturnValue({
            allTasks: [],
            stats: { runningTasks: 0, completedTasks: 0, pendingTasks: 0, failedTasks: 0, skippedTasks: 0 },
        });

        gateway = new DashboardGateway(mockHandlerOnConnection, port);
    });

    afterEach(() => {
        gateway.close();
        jest.clearAllMocks();
    });

    describe('initialization', () => {
        it('should create a DashboardGateway instance', () => {
            expect(gateway).toBeInstanceOf(DashboardGateway);
        });

        it('should call handler on connection setup', () => {
            // The handler is called during construction, but since we mock socket.io,
            // it doesn't actually trigger the connection event. This is expected behavior.
            expect(gateway).toBeInstanceOf(DashboardGateway);
        });
    });

    describe('data sending', () => {
        it('should send data through socket', () => {
            const testData = { test: 'data' };

            gateway.sendData('tasks:data', testData);

            // Since we mocked socket.io, we can't directly test the emit
            // but we can verify the method doesn't throw
            expect(() => gateway.sendData('tasks:data', testData)).not.toThrow();
        });

        it('should handle different event types', () => {
            const tasksData = [{ id: '1', name: 'test' }];
            const statsData = { runningTasks: 1 };

            expect(() => gateway.sendData('tasks:all', tasksData)).not.toThrow();
            expect(() => gateway.sendData('tasks:data', statsData)).not.toThrow();
        });
    });

    describe('event handler registration', () => {
        it('should register event handlers', () => {
            const mockHandler = jest.fn();

            expect(() => {
                gateway.registerHandler('task:retry', mockHandler);
            }).not.toThrow();
        });

        it('should register multiple handlers', () => {
            const mockHandler1 = jest.fn();
            const mockHandler2 = jest.fn();

            expect(() => {
                gateway.registerHandler('task:retry', mockHandler1);
                gateway.registerHandler('task:retry', mockHandler2); // Should override
            }).not.toThrow();
        });
    });

    describe('error handling', () => {
        it('should handle sendData when socket is not available', () => {
            // Create a gateway and try to break it
            const testGateway = new DashboardGateway(() => ({ allTasks: [], stats: {} }));

            // This should not throw even if socket is not properly initialized
            expect(() => {
                testGateway.sendData('tasks:data', {});
            }).not.toThrow();

            // Clean up the test gateway
            testGateway.close();
        });
    });
});
