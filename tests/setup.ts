// Global test setup

beforeEach(() => {
    jest.clearAllMocks();
});

afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
});

jest.setTimeout(30000);

global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};
