import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as schema from '../src/database/schema';

async function seed() {
  const pool = new Pool({
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    user: process.env.POSTGRES_USER ?? 'postgres',
    password: process.env.POSTGRES_PASSWORD ?? 'postgres',
    database: process.env.POSTGRES_DB ?? 'ncfresearch',
  });

  const db = drizzle(pool, { schema });

  // 1. Seed roles
  await db.insert(schema.roles).values([
    { id: 1, name: 'admin' },
    { id: 2, name: 'ncf_user' },
    { id: 3, name: 'non_ncf_user' },
  ]).onConflictDoNothing();

  // 2. Seed default admin
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@ncf.edu.ph';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin123!';
  const hashed = await bcrypt.hash(adminPassword, 10);

  await db.insert(schema.users).values({
    firstName: 'Admin',
    lastName: 'User',
    email: adminEmail,
    password: hashed,
    roleId: 1,
    isVerified: true,
  }).onConflictDoNothing();

  console.log('✓ Roles seeded (admin, ncf_user, non_ncf_user)');
  console.log(`✓ Admin account created:
   Email:    ${adminEmail}
   Password: ${adminPassword}
   Role:     admin`);

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
