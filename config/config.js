const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET,
  adminUserIds: (process.env.PORTFOLIO_ADMIN_IDS || '')
    .split(',')
    .map((id) => id.trim().toLowerCase())
    .filter((id) => /^[a-f0-9]{24}$/.test(id)),
  mongoUri: process.env.MONGODB_URI ||
    process.env.MONGO_HOST ||
    `mongodb://${process.env.IP || '127.0.0.1'}:${process.env.MONGO_PORT || '27017'}/Portfolio`
};

export default config;
