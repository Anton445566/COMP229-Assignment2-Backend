import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const envPath = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(envPath)) process.loadEnvFile(envPath);
const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET,
  mongoUri: process.env.MONGODB_URI ||
    process.env.MONGO_HOST ||
    `mongodb://${process.env.IP || '127.0.0.1'}:${process.env.MONGO_PORT || '27017'}/Portfolio`
};

export default config;
