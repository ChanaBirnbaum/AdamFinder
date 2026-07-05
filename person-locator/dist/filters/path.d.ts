/** Primitive types that terminate path recursion. */
type Primitive = string | number | boolean | bigint | symbol | undefined | null;
type IsPlainObject<T> = T extends Primitive ? false : T extends readonly unknown[] ? false : T extends (...args: never[]) => unknown ? false : true;
/** Decrements a bounded depth counter so the recursion below always terminates. */
type Prev<D extends number> = D extends 4 ? 3 : D extends 3 ? 2 : D extends 2 ? 1 : D extends 1 ? 0 : 0;
/**
 * All dot-separated key paths into `T`, up to 4 levels deep.
 * Known object shapes get real autocomplete; an open index signature (e.g. `Record<string, unknown>`)
 * collapses to a `${prefix}.${string}` pattern, which still accepts any field name under it.
 */
export type Path<T, Depth extends number = 4> = Depth extends 0 ? never : T extends Primitive ? never : {
    [K in keyof T & string]: IsPlainObject<T[K]> extends true ? `${K}` | `${K}.${Path<T[K], Prev<Depth>>}` : `${K}`;
}[keyof T & string];
/**
 * A field reference: autocompletes known paths on `T` via `Path<T>`, but still accepts
 * any string — the set of filterable Elasticsearch fields is not closed to `T`'s shape.
 */
export type FieldRef<T> = Path<T> | (string & {});
/** Resolves the value type at a known path `P` on `T`. Falls back to `unknown` once the path leaves typed territory. */
export type ValueAtPath<T, P extends string> = P extends `${infer Head}.${infer Rest}` ? Head extends keyof T ? ValueAtPath<T[Head], Rest> : unknown : P extends keyof T ? T[P] : unknown;
export {};
