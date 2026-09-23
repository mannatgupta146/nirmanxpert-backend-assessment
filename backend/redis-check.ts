import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const testRedis = async () => {
  const client = createClient({
    url: process.env.REDIS_URL,
  });

  client.on('error', (err) => console.log('Redis Client Error:', err));

  try {
    console.log(`Attempting to connect to Redis at ${process.env.REDIS_URL}...`);
    await client.connect();
    console.log('✅ Successfully connected to Redis Cloud!');
    
    // Test a basic set/get
    await client.set('test_key', 'hello_from_nirmanxpert');
    const val = await client.get('test_key');
    console.log(`✅ Successfully tested read/write: test_key -> ${val}`);

    await client.disconnect();
    console.log('Disconnected gracefully.');
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
  }
};

testRedis();
