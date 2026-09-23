import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data to prevent duplicates on re-seed
  await prisma.message.deleteMany({});
  await prisma.channelMember.deleteMany({});
  await prisma.channel.deleteMany({});
  await prisma.user.deleteMany({});

  const defaultPassword = await bcrypt.hash('password123', 10);

  // 1. Create Users (Admin, Moderator, Member)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      passwordHash: defaultPassword,
      role: 'ADMIN',
    },
  });
  console.log(`✅ Created Admin user: ${admin.email}`);

  const mod = await prisma.user.create({
    data: {
      email: 'mod@test.com',
      passwordHash: defaultPassword,
      role: 'MODERATOR',
    },
  });
  console.log(`✅ Created Moderator user: ${mod.email}`);

  const member = await prisma.user.create({
    data: {
      email: 'member@test.com',
      passwordHash: defaultPassword,
      role: 'MEMBER',
    },
  });
  console.log(`✅ Created Member user: ${member.email}`);

  // 2. Create a default Channel
  const channel = await prisma.channel.create({
    data: {
      name: 'General',
      isPublic: true,
      createdById: admin.id,
    },
  });
  console.log(`✅ Created Channel: ${channel.name}`);

  // 3. Add users to the Channel
  await prisma.channelMember.createMany({
    data: [
      { userId: admin.id, channelId: channel.id },
      { userId: mod.id, channelId: channel.id },
      { userId: member.id, channelId: channel.id },
    ],
  });
  console.log(`✅ Added users to Channel`);

  console.log('✅ Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
