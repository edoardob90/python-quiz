/**
 * Alpine.js TypeScript Type Utilities
 *
 * Helper types for properly typing Alpine.js components with magic properties.
 */

/**
 * Alpine magic properties interface
 * Includes $el, $watch, $refs, $nextTick, etc.
 */
export interface AlpineMagics<T = any> {
  $el: HTMLElement;
  $refs: Record<string, HTMLElement>;
  $watch: <K extends keyof T>(
    property: K,
    callback: (newValue: T[K], oldValue: T[K]) => void,
  ) => void;
  $nextTick: (callback?: () => void) => Promise<void>;
  $dispatch: (event: string, detail?: any) => void;
  $data: T;
}

/**
 * Helper type to properly type Alpine.js components with magic properties.
 * Merges your component data with Alpine's magic properties ($el, $watch, $refs, etc.)
 *
 * Usage:
 * ```typescript
 * export function myComponent() {
 *   const component = {
 *     data: "value",
 *     init(this: AlpineComponentType<typeof component>) {
 *       this.$watch("data", (newValue) => { ... });
 *     }
 *   };
 *   return component as AlpineComponentType<typeof component>;
 * }
 * ```
 */
export type AlpineComponentType<T> = T & AlpineMagics<T>;
