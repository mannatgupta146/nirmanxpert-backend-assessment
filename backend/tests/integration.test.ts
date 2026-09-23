import request from 'supertest';
import express from 'express';
import { PrismaClient, Role } from '@prisma/client';
import authRoutes from '../src/routes/auth.routes';
import channelRoutes from '../src/routes/channel.routes';
import userRoutes from '../src/routes/user.routes';
import { hashPassword } from '../src/utils/hash';
import { generateAccessToken } from '../src/utils/jwt';

// Initialize a test Express app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/users', userRoutes);

const prisma = new PrismaClient();

// Test accounts
const TEST_ADMIN = { email: 'admin_test@test.com', role: Role.ADMIN };
const TEST_MOD = { email: 'mod_test@test.com', role: Role.MODERATOR };
const TEST_MEMBER = { email: 'member_test@test.com', role: Role.MEMBER };

let adminToken = '';
let modToken = '';
let memberToken = '';
let adminId = '';
let modId = '';
let memberId = '';
let testChannelId = '';

beforeAll(async () => {
  // Clean up any previous test data
  await prisma.message.deleteMany({ where: { sender: { email: { contains: '_test@test.com' } } } });
  await prisma.channelMember.deleteMany({ where: { user: { email: { contains: '_test@test.com' } } } });
  await prisma.channel.deleteMany({ where: { name: 'test-channel' } });
  await prisma.user.deleteMany({ where: { email: { contains: '_test@test.com' } } });

  // Seed test users
  const hashedPw = await hashPassword('password123');
  
  const admin = await prisma.user.create({ data: { ...TEST_ADMIN, passwordHash: hashedPw } });
  const mod = await prisma.user.create({ data: { ...TEST_MOD, passwordHash: hashedPw } });
  const member = await prisma.user.create({ data: { ...TEST_MEMBER, passwordHash: hashedPw } });

  adminId = admin.id;
  modId = mod.id;
  memberId = member.id;

  adminToken = generateAccessToken({ userId: admin.id, role: admin.role as any });
  modToken = generateAccessToken({ userId: mod.id, role: mod.role as any });
  memberToken = generateAccessToken({ userId: member.id, role: member.role as any });
});

afterAll(async () => {
  // Clean up
  await prisma.message.deleteMany({ where: { sender: { email: { contains: '_test@test.com' } } } });
  await prisma.channelMember.deleteMany({ where: { user: { email: { contains: '_test@test.com' } } } });
  await prisma.channel.deleteMany({ where: { name: 'test-channel' } });
  await prisma.user.deleteMany({ where: { email: { contains: '_test@test.com' } } });
  
  await prisma.$disconnect();
});

describe('Authentication API', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new_test@test.com', password: 'password123', role: 'MEMBER' });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('user');
    
    // Cleanup
    await prisma.user.delete({ where: { email: 'new_test@test.com' } });
  });

  it('should reject invalid credentials on login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_ADMIN.email, password: 'wrongpassword' });
    
    expect(res.statusCode).toEqual(401);
  });
});

describe('RBAC & Channels API', () => {
  it('Admin can create a channel', async () => {
    const res = await request(app)
      .post('/api/channels')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'test-channel', isPublic: true });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    testChannelId = res.body.id;
  });

  it('Member CANNOT create a channel (RBAC)', async () => {
    const res = await request(app)
      .post('/api/channels')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'member-channel', isPublic: true });
    
    expect(res.statusCode).toEqual(403);
  });

  it('Members can join a public channel', async () => {
    const res = await request(app)
      .post(`/api/channels/${testChannelId}/join`)
      .set('Authorization', `Bearer ${memberToken}`);
    
    expect(res.statusCode).toEqual(200);
  });

  it('Duplicate membership is rejected', async () => {
    const res = await request(app)
      .post(`/api/channels/${testChannelId}/join`)
      .set('Authorization', `Bearer ${memberToken}`);
    
    expect(res.statusCode).toEqual(409); // Conflict
  });
});

describe('Moderation API', () => {
  it('Moderator can mute a member', async () => {
    // First Mod joins
    await request(app)
      .post(`/api/channels/${testChannelId}/join`)
      .set('Authorization', `Bearer ${modToken}`);

    // Mod mutes member
    const res = await request(app)
      .post(`/api/channels/${testChannelId}/mute`)
      .set('Authorization', `Bearer ${modToken}`)
      .send({ userId: memberId, isMuted: true });
    
    expect(res.statusCode).toEqual(200);
  });

  it('Member CANNOT mute someone (RBAC)', async () => {
    const res = await request(app)
      .post(`/api/channels/${testChannelId}/mute`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ userId: modId, isMuted: true });
    
    expect(res.statusCode).toEqual(403);
  });
});
