import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import * as schema from './schema';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: 'drizzle' });
  console.log('Migrations complete.');

  // Seed demo user
  const existing = await db.select().from(schema.users).where(
    // @ts-ignore
    require('drizzle-orm').eq(schema.users.email, 'demo@example.com')
  ).limit(1);

  if (existing.length === 0) {
    const hash = await bcrypt.hash('demo-learn-2026', 10);
    await db.insert(schema.users).values({
      email: 'demo@example.com',
      passwordHash: hash,
    });
    console.log('Demo user seeded.');
  }

  await pool.end();
}

main().catch(console.error);
