#!/usr/bin/env node
/**
 * Ejecuta el script de migración combinado contra Supabase SQL Editor.
 * Uso: node run-migration.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Supabase credentials
const PROJECT_REF = 'fkjuswkjzaeuogctsxpw';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZranVzd2tqemFldW9nY3RzeHB3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzAzMzIxNCwiZXhwIjoyMDkyNjA5MjE0fQ.6u70Q-xqVkPk_NfaaCBO_9Ekgu-1JBMwXkFpHMTxLic';

async function runSQL(sql) {
  const url = `https://${PROJECT_REF}.supabase.co/rest/v1/rpc/exec_sql`;

  // Try using the pg_net extension for SQL execution
  const response = await fetch(`https://${PROJECT_REF}.supabase.co/rest/v1/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({ query: sql }),
  });

  return response;
}

async function main() {
  console.log('🔄 Conectando a Supabase...');

  // Read the migration file
  const migrationPath = join(__dirname, 'supabase', 'combined-migration.sql');
  const sql = readFileSync(migrationPath, 'utf8');

  console.log(`📄 Migración cargada: ${(sql.length / 1024).toFixed(1)} KB`);
  console.log('⚠️  Para ejecutar la migración:');
  console.log('   1. Abrí el Supabase Dashboard: https://supabase.com/dashboard/project/' + PROJECT_REF);
  console.log('   2. Andá a SQL Editor');
  console.log('   3. Pegá el contenido de: supabase/combined-migration.sql');
  console.log('   4. Ejecutá el script');
  console.log('');
  console.log('📝 Después de ejecutar la migración, creá estos usuarios en Authentication > Users:');
  console.log('   - sindygeisert@gmail.com (admin) — Password: T@beg2301');
  console.log('   - pabloeckert@gmail.com (admin) — Password: T@beg2301');
  console.log('   - mejoraok@gmail.com (vendedor) — Password: T@beg2301');
  console.log('');
  console.log('🔗 URL del proyecto: https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql');
}

main().catch(console.error);
