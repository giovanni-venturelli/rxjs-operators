#!/usr/bin/env node
/**
 * Build, test e pubblicazione di una libreria del workspace.
 *
 * Uso:
 *   node scripts/publish.mjs <progetto> [opzioni]
 *   npm run publish:lib -- <progetto> [opzioni]
 *
 * Opzioni:
 *   --bump <patch|minor|major|prerelease|x.y.z>  Incrementa la versione prima della pubblicazione
 *   --preid <id>                                 Identificativo prerelease (es. beta) usato con --bump prerelease
 *   --tag <dist-tag>                             Dist-tag npm (default: latest)
 *   --local                                      Pubblica sul registry locale Verdaccio (http://localhost:4873)
 *   --registry <url>                             Registry personalizzato
 *   --dry-run                                    Esegue tutto tranne la pubblicazione effettiva
 *   --skip-tests                                 Salta i test
 *   --otp <codice>                               Codice 2FA per npm
 *   -h, --help                                   Mostra questo aiuto
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LOCAL_REGISTRY = 'http://localhost:4873';
const NPM_REGISTRY = 'https://registry.npmjs.org';

const { values: opts, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    bump: { type: 'string' },
    preid: { type: 'string' },
    tag: { type: 'string', default: 'latest' },
    local: { type: 'boolean', default: false },
    registry: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    'skip-tests': { type: 'boolean', default: false },
    otp: { type: 'string' },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

if (opts.help || positionals.length !== 1) {
  const header = readFileSync(fileURLToPath(import.meta.url), 'utf8').match(/\/\*\*([\s\S]*?)\*\//)[1];
  console.log(header.replace(/^ \* ?/gm, ''));
  process.exit(opts.help ? 0 : 1);
}

const project = positionals[0];
const projectDir = join(ROOT, 'packages', project);
const pkgPath = join(projectDir, 'package.json');
const registry = (opts.registry ?? (opts.local ? LOCAL_REGISTRY : NPM_REGISTRY)).replace(/\/$/, '');
const isLocal = registry === LOCAL_REGISTRY;
const dryRun = opts['dry-run'];

const step = (msg) => console.log(`\n\x1b[36m▶ ${msg}\x1b[0m`);
const fail = (msg) => {
  console.error(`\n\x1b[31m✖ ${msg}\x1b[0m`);
  process.exit(1);
};

function run(cmd, args, { cwd = ROOT, capture = false, allowFail = false } = {}) {
  const res = spawnSync(cmd, args, {
    cwd,
    shell: process.platform === 'win32',
    stdio: capture ? 'pipe' : 'inherit',
    encoding: 'utf8',
  });
  if (res.status !== 0 && !allowFail) {
    throw new Error(`Comando fallito: ${cmd} ${args.join(' ')}`);
  }
  return res;
}

if (!existsSync(pkgPath)) fail(`Progetto "${project}" non trovato in packages/`);

const originalPkg = readFileSync(pkgPath, 'utf8');
const pkg = JSON.parse(originalPkg);

try {
  // 1. Verifiche preliminari
  step(`Verifiche preliminari (${pkg.name} → ${registry})`);
  if (isLocal) {
    const ping = run('npm', ['ping', '--registry', registry], { capture: true, allowFail: true });
    if (ping.status !== 0) {
      fail(`Registry locale non raggiungibile. Avvialo in un altro terminale con: npx nx local-registry`);
    }
  } else if (!dryRun) {
    const who = run('npm', ['whoami', '--registry', registry], { capture: true, allowFail: true });
    if (who.status !== 0) fail(`Non sei autenticato su ${registry}. Esegui: npm login --registry ${registry}`);
    console.log(`Autenticato come ${who.stdout.trim()}`);
    const dirty = run('git', ['status', '--porcelain', '--', projectDir], { capture: true }).stdout.trim();
    if (dirty) console.warn('\x1b[33m⚠ Ci sono modifiche non committate nella libreria.\x1b[0m');
  }

  // 2. Versione
  if (opts.bump) {
    step(`Aggiornamento versione (${opts.bump})`);
    const args = ['version', opts.bump, '--no-git-tag-version', '--allow-same-version'];
    if (opts.preid) args.push('--preid', opts.preid);
    run('npm', args, { cwd: projectDir, capture: true });
  }
  const version = JSON.parse(readFileSync(pkgPath, 'utf8')).version;
  console.log(`Versione: ${version}`);

  const existing = run('npm', ['view', `${pkg.name}@${version}`, 'version', '--registry', registry], {
    capture: true,
    allowFail: true,
  });
  if (existing.status === 0 && existing.stdout.trim() === version) {
    fail(`${pkg.name}@${version} è già pubblicato su ${registry}. Usa --bump per incrementare la versione.`);
  }

  // 3. Test
  if (!opts['skip-tests']) {
    step('Esecuzione test');
    run('npx', ['nx', 'test', project, '--skip-nx-cache']);
  }

  // 4. Build pulita
  step('Build');
  rmSync(join(projectDir, 'dist'), { recursive: true, force: true });
  run('npx', ['nx', 'build', project, '--skip-nx-cache']);

  // 5. Pubblicazione
  step(dryRun ? 'Pubblicazione (dry-run)' : 'Pubblicazione');
  const publishArgs = ['publish', '--access', 'public', '--registry', registry, '--tag', opts.tag];
  if (dryRun) publishArgs.push('--dry-run');
  if (opts.otp) publishArgs.push('--otp', opts.otp);
  // Verdaccio accetta pubblicazioni anonime, ma npm richiede comunque un token
  if (isLocal) publishArgs.push(`--${registry.replace(/^https?:/, '')}/:_authToken=local`);
  run('npm', publishArgs, { cwd: projectDir });

  if (dryRun && opts.bump) writeFileSync(pkgPath, originalPkg);

  console.log(`\n\x1b[32m✔ ${pkg.name}@${version} ${dryRun ? 'pronto (dry-run)' : `pubblicato su ${registry}`}\x1b[0m`);
  if (opts.bump && !dryRun && !isLocal) {
    console.log(`Ricorda di committare il bump di versione:\n  git commit -am "release: ${pkg.name}@${version}" && git tag ${pkg.name}@${version}`);
  }
} catch (err) {
  // In caso di errore ripristina il package.json originale
  writeFileSync(pkgPath, originalPkg);
  fail(err.message);
}
