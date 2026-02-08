declare module 'jest-axe' {
    function axe(html: Element | string, options?: Record<string, unknown>): Promise<unknown>;
    const toHaveNoViolations: {
        toHaveNoViolations(result: unknown): { pass: boolean; message(): string };
    };
}

declare namespace jest {
    interface Matchers<R> {
        toHaveNoViolations(): R;
    }
}
