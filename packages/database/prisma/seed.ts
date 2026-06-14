import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  if (process.env['NODE_ENV'] === 'production') {
    console.warn('Seed skipped: NODE_ENV=production. Run seed only in development/staging.');
    return;
  }

  console.log('Seeding database...');

  const SALT_ROUNDS = 12;

  // ─── Users ──────────────────────────────────────────────────────────────────
  const [admin, mod1, mod2] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@platform.com' },
      update: {},
      create: {
        email: 'admin@platform.com',
        passwordHash: await bcrypt.hash('admin123', SALT_ROUNDS),
        role: Role.ADMIN,
      },
    }),
    prisma.user.upsert({
      where: { email: 'mod1@platform.com' },
      update: {},
      create: {
        email: 'mod1@platform.com',
        passwordHash: await bcrypt.hash('mod123', SALT_ROUNDS),
        role: Role.MODERATOR,
      },
    }),
    prisma.user.upsert({
      where: { email: 'mod2@platform.com' },
      update: {},
      create: {
        email: 'mod2@platform.com',
        passwordHash: await bcrypt.hash('mod123', SALT_ROUNDS),
        role: Role.MODERATOR,
      },
    }),
  ]);

  console.log(`Users seeded: ${admin.email}, ${mod1.email}, ${mod2.email}`);

  console.log('Seeding complete.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
