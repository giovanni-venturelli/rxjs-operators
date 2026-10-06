# or-empty-array

A lightweight, strongly typed RxJS pipeable operator that converts `null` or `undefined` values (for example HTTP `204 No Content` responses or streams with empty values) into an empty array `[]`. If the emitted value is already an array, it is returned unchanged.

## Installation

```bash
npm install or-empty-array
```

*Note: requires `rxjs` (>= 7.0.0).*

## Usage

```typescript
import { of } from 'rxjs';
import { orEmptyArray } from 'or-empty-array';

// Handling null responses -> []
of<string[] | null>(null)
  .pipe(orEmptyArray())
  .subscribe((items) => {
    console.log(items); // []
  });

// Handling undefined responses -> []
of<number[] | undefined>(undefined)
  .pipe(orEmptyArray())
  .subscribe((items) => {
    console.log(items); // []
  });

// Leaves existing arrays unchanged
of(['item1', 'item2'])
  .pipe(orEmptyArray())
  .subscribe((items) => {
    console.log(items); // ['item1', 'item2']
  });
```

### Angular / HTTP Client example

```typescript
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { orEmptyArray } from 'or-empty-array';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ItemsService {
  private http = inject(HttpClient);

  getItems(): Observable<Item[]> {
    return this.http.get<Item[] | null>('/api/items').pipe(
      orEmptyArray()
    );
  }
}
```

## Build & Test

```bash
# Build
npx nx build or-empty-array

# Test
npx nx test or-empty-array
```
