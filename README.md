# rxjs-operators

A collection of small, strongly typed RxJS pipeable operators, each published as its own npm package.

## Packages

| Package                                         | Description                                                     |
| ----------------------------------------------- | --------------------------------------------------------------- |
| [`or-empty-array`](packages/or-empty-array)     | Converts `null` / `undefined` emissions into an empty array `[]` |

```typescript
import { of } from 'rxjs';
import { orEmptyArray } from 'or-empty-array';

of<string[] | null>(null).pipe(orEmptyArray()).subscribe(console.log); // []
```

See each package's README for full documentation.

## Requirements

- Node.js 20+
- npm (workspaces)
- `rxjs` >= 7 as a peer dependency in consuming projects

## Getting started

```bash
npm install
```

## Workspace structure

```
packages/
  or-empty-array/     # one folder per operator / npm package
    src/
      index.ts        # public API
      lib/            # implementation + *.spec.ts tests
```

The repository is an [Nx](https://nx.dev) workspace: `build`, `test` and `typecheck` targets are inferred automatically from each package's `tsconfig.lib.json` and `jest.config.cts`.

## Common commands

| Command                              | What it does                                   |
| ------------------------------------ | ---------------------------------------------- |
| `npm run build`                      | Build all packages                             |
| `npm test`                           | Run all tests                                  |
| `npx nx build <package>`             | Build a single package                         |
| `npx nx test <package>`              | Test a single package                          |
| `npm run build:or-empty-array`       | Build `or-empty-array`                         |
| `npm run publish:or-empty-array`     | Build and publish `or-empty-array` to npm      |

## Publishing

1. Log in to npm (once):
   ```bash
   npm login
   npm whoami
   ```
2. Bump the version:
   ```bash
   npm version patch -w or-empty-array   # or minor / major
   ```
3. Build and publish:
   ```bash
   npm run publish:or-empty-array
   ```
   With 2FA enabled: `npm run publish:or-empty-array -- --otp=123456`.

To check what would be published without publishing:

```bash
npm run build:or-empty-array
npm publish -w or-empty-array --dry-run
```

### Local registry (Verdaccio)

To test a package locally before publishing to npm:

```bash
npx nx run @rxjs-operators/source:local-registry             # starts Verdaccio on http://localhost:4873
npm publish -w or-empty-array --registry http://localhost:4873
```

## Adding a new operator

1. Generate a new library:
   ```bash
   npx nx g @nx/js:lib packages/<name> --publishable --importPath=<name> --unitTestRunner=jest
   ```
2. Implement the operator in `packages/<name>/src/lib/` and export it from `src/index.ts`.
3. Add `rxjs` as a `peerDependency` in the package's `package.json`.
4. Add `build:<name>` and `publish:<name>` scripts to the root `package.json`, following the `or-empty-array` ones.

## License

MIT © Giovanni Venturelli
