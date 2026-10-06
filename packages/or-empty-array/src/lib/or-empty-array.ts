import { map, type OperatorFunction } from 'rxjs';

/**
 * Operatore RxJS pipeable che trasforma valori `null` o `undefined` (ad esempio risposte HTTP 204 No Content)
 * in un array vuoto `[]`. Se il valore sorgente è già un array, viene restituito inalterato.
 *
 * @template T Il tipo degli elementi dell'array.
 * @returns {OperatorFunction<T[] | null | undefined, T[]>} Un operatore pipeable RxJS.
 *
 * @example
 * ```typescript
 * import { of } from 'rxjs';
 * import { orEmptyArray } from 'or-empty-array';
 *
 * // null -> []
 * of(null).pipe(orEmptyArray()).subscribe(console.log); // []
 *
 * // undefined -> []
 * of(undefined).pipe(orEmptyArray()).subscribe(console.log); // []
 *
 * // ['a', 'b'] -> ['a', 'b']
 * of(['a', 'b']).pipe(orEmptyArray()).subscribe(console.log); // ['a', 'b']
 * ```
 */
export function orEmptyArray<T>(): OperatorFunction<
  T[] | null | undefined,
  T[]
> {
  return map((res: T[] | null | undefined): T[] => res ?? []);
}
