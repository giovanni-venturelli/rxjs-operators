import { of, firstValueFrom } from 'rxjs';
import { toArray } from 'rxjs/operators';
import { orEmptyArray } from './or-empty-array.js';

describe('orEmptyArray', () => {
  it('should convert null to an empty array', async () => {
    const source$ = of<string[] | null>(null).pipe(orEmptyArray());
    const result = await firstValueFrom(source$);
    expect(result).toEqual([]);
  });

  it('should convert undefined to an empty array', async () => {
    const source$ = of<number[] | undefined>(undefined).pipe(orEmptyArray());
    const result = await firstValueFrom(source$);
    expect(result).toEqual([]);
  });

  it('should keep existing non-empty array intact', async () => {
    const items = [1, 2, 3];
    const source$ = of<number[] | null | undefined>(items).pipe(orEmptyArray());
    const result = await firstValueFrom(source$);
    expect(result).toEqual([1, 2, 3]);
  });

  it('should keep existing empty array intact', async () => {
    const items: string[] = [];
    const source$ = of<string[] | null | undefined>(items).pipe(orEmptyArray());
    const result = await firstValueFrom(source$);
    expect(result).toEqual([]);
  });

  it('should handle a stream of mixed values correctly', async () => {
    const values: (string[] | null | undefined)[] = [
      ['a', 'b'],
      null,
      ['c'],
      undefined,
      [],
    ];

    const source$ = of(...values).pipe(orEmptyArray(), toArray());
    const result = await firstValueFrom(source$);

    expect(result).toEqual([
      ['a', 'b'],
      [],
      ['c'],
      [],
      [],
    ]);
  });
});
