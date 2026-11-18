import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

try {
  process.loadEnvFile();
} catch {
  // no local .env: rely on the process environment (e.g. Vercel)
}

const allowMissing = process.argv.includes('--allow-missing');
const url = (process.env.SUPABASE_URL ?? '').trim();
const anonKey = (process.env.SUPABASE_ANON_KEY ?? '').trim();

if ((!url || !anonKey) && !allowMissing) {
  console.error(
    '\n[set-env] SUPABASE_URL et/ou SUPABASE_ANON_KEY manquent.\n' +
    '  - En local : copiez .env.example vers .env et renseignez les valeurs (Supabase > Project Settings > API).\n' +
    '  - Sur Vercel : Project Settings > Environment Variables.\n'
  );
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(root, 'src/environments/environment.ts');
mkdirSync(dirname(target), { recursive: true });
writeFileSync(
  target,
  `// Généré par scripts/set-env.mjs — ne pas modifier ni committer.\n` +
  `export const environment = {\n` +
  `  supabaseUrl: ${JSON.stringify(url)},\n` +
  `  supabaseAnonKey: ${JSON.stringify(anonKey)},\n` +
  `};\n`
);
console.log(`[set-env] src/environments/environment.ts généré (${url || 'valeurs vides'}).`);
