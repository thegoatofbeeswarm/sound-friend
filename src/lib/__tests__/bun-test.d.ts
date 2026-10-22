// Minimal types for the parts of Bun's test runner these tests use. Pulling in
// @types/bun would retype global fetch and break the Supabase clients.
declare module "bun:test" {
  interface Matchers {
    toBe(expected: unknown): void;
    toBeNull(): void;
    toBeUndefined(): void;
    toBeCloseTo(expected: number, digits?: number): void;
    toBeGreaterThan(expected: number): void;
    toBeLessThan(expected: number): void;
    toBeLessThanOrEqual(expected: number): void;
    toBeGreaterThanOrEqual(expected: number): void;
    toEqual(expected: unknown): void;
    not: Matchers;
  }
  export function describe(name: string, fn: () => void): void;
  export function test(name: string, fn: () => void | Promise<void>): void;
  export function beforeEach(fn: () => void): void;
  export function expect(value: unknown): Matchers;
}
