require('dotenv').config();
const { z } = require('zod');

try {
  console.log('Testing environment validation...');
  console.log('DATABASE_URL from env:', process.env.DATABASE_URL);
  
  const EnvSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.string().optional(),
    DATABASE_URL: z.string().url(),
    JWT_ACCESS_SECRET: z.string().min(1),
    JWT_REFRESH_SECRET: z.string().min(1),
    JWT_ACCESS_EXPIRES: z.string().optional(),
    JWT_REFRESH_EXPIRES: z.string().optional(),
    CORS_ORIGIN: z.string().optional(),
  });

  const env = EnvSchema.parse(process.env);
  console.log('✅ Environment validation successful');
  console.log('Validated env:', env);
  
} catch (error) {
  console.log('❌ Environment validation failed!');
  console.log('Error:', error.message);
  console.log('Error details:', error.errors);
}
