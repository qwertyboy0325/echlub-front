declare namespace jest {
    interface Matchers<R> {
        toBe(expected: any): R;
        toEqual(expected: any): R;
        toBeDefined(): R;
        toBeUndefined(): R;
        toBeNull(): R;
        toBeTruthy(): R;
        toBeFalsy(): R;
        toBeGreaterThan(expected: number): R;
        toBeLessThan(expected: number): R;
        toBeGreaterThanOrEqual(expected: number): R;
        toBeLessThanOrEqual(expected: number): R;
        toBeCloseTo(expected: number, numDigits?: number): R;
        toMatch(expected: string | RegExp): R;
        toContain(expected: any): R;
        toHaveLength(expected: number): R;
        toHaveProperty(propPath: string, value?: any): R;
        toBeInstanceOf(expected: any): R;
        toThrow(expected?: string | RegExp | Error): R;
        toHaveBeenCalled(): R;
        toHaveBeenCalledTimes(times: number): R;
        toHaveBeenCalledWith(...args: any[]): R;
        toHaveBeenCalledWithMatch(...args: any[]): R;
        toHaveBeenLastCalledWith(...args: any[]): R;
        toHaveBeenLastCalledWithMatch(...args: any[]): R;
        toHaveBeenNthCalledWith(nthCall: number, ...args: any[]): R;
        toHaveBeenNthCalledWithMatch(nthCall: number, ...args: any[]): R;
        toHaveReturned(): R;
        toHaveReturnedTimes(times: number): R;
        toHaveReturnedWith(expected: any): R;
        toHaveLastReturnedWith(expected: any): R;
        toHaveNthReturnedWith(nthCall: number, expected: any): R;
        toBeNaN(): R;
        toContainEqual(expected: any): R;
        toMatchObject(expected: any): R;
        toMatchSnapshot(propertyMatchers?: any, snapshotName?: string): R;
        toThrowErrorMatchingSnapshot(): R;
        toThrowErrorMatchingInlineSnapshot(snapshot?: string): R;
        resolves: Matchers<Promise<R>>;
        rejects: Matchers<Promise<R>>;
        not: Matchers<R>;
        any(expected: any): R;
    }

    interface Mock<T = any, Y extends any[] = any> {
        (...args: Y): T;
        mock: {
            calls: Y[];
            instances: T[];
            invocationCallOrder: number[];
            results: Array<{
                type: 'return' | 'throw';
                value: T;
            }>;
        };
        mockClear(): void;
        mockReset(): void;
        mockRestore(): void;
        mockImplementation(fn: (...args: Y) => T): this;
        mockImplementationOnce(fn: (...args: Y) => T): this;
        mockName(name: string): this;
        mockReturnThis(): this;
        mockReturnValue(value: T): this;
        mockReturnValueOnce(value: T): this;
        mockResolvedValue(value: T): this;
        mockResolvedValueOnce(value: T): this;
        mockRejectedValue(value: any): this;
        mockRejectedValueOnce(value: any): this;
    }

    interface MockInstance<T = any, Y extends any[] = any> extends Mock<T, Y> {
        new (...args: Y): T;
    }

    interface SpyInstance<T = any, Y extends any[] = any> extends Mock<T, Y> {
        restore(): void;
    }

    interface Expect {
        <T = any>(actual: T): Matchers<T>;
        any(expected: any): any;
        anything(): any;
        arrayContaining<T = any>(sample: Array<T>): Array<T>;
        objectContaining<T = any>(sample: Partial<T>): T;
        stringContaining(expected: string): string;
        stringMatching(expected: string | RegExp): string;
        assertions(numberOfAssertions: number): void;
        extend(matchers: Record<string, any>): void;
        getState(): any;
        setState(state: any): void;
        addEqualityTesters(testers: Array<any>): void;
    }

    interface Jest {
        fn<T = any, Y extends any[] = any>(implementation?: (...args: Y) => T): Mock<T, Y>;
        spyOn<T extends {}, M extends keyof T>(object: T, method: M): SpyInstance<T[M] extends (...args: any[]) => any ? ReturnType<T[M]> : never, T[M] extends (...args: any[]) => any ? Parameters<T[M]> : never>;
        clearAllMocks(): void;
        resetAllMocks(): void;
        restoreAllMocks(): void;
        useFakeTimers(): void;
        useRealTimers(): void;
        runOnlyPendingTimers(): void;
        runAllTimers(): void;
        advanceTimersByTime(msToRun: number): void;
        runOnlyPendingTimersAsync(): Promise<void>;
        runAllTimersAsync(): Promise<void>;
        advanceTimersByTimeAsync(msToRun: number): Promise<void>;
        unmock(moduleName: string): void;
        doMock(moduleName: string, factory?: () => any, options?: { virtual?: boolean }): void;
        resetModules(): void;
        isolateModules(fn: () => void): void;
        setMock(moduleName: string, moduleExports: any): void;
        requireActual<T = any>(moduleName: string): T;
        requireMock<T = any>(moduleName: string): T;
        genMockFromModule<T = any>(moduleName: string): T;
        createMockFromModule<T = any>(moduleName: string): T;
    }

    const expect: Expect;
    const jest: Jest;
}

declare const jest: {
    fn: () => jest.Mock;
    spyOn: (object: any, methodName: string) => jest.Mock;
};

declare const describe: (name: string, fn: () => void) => void;
declare const test: (name: string, fn: () => void | Promise<void>) => void;
declare const expect: {
    <T = any>(actual: T): jest.Matchers<T>;
    any(expected: any): any;
};
declare const beforeEach: (fn: () => void | Promise<void>) => void;
declare const afterEach: (fn: () => void | Promise<void>) => void; 