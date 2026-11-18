import "dotenv/config";

export const env = {
  NODE_ENV: process.env.NODE_ENV || "dev",
  APP_HOST: process.env.APP_HOST || "0.0.0.0",
  APP_PORT: Number(process.env.APP_PORT || process.env.PORT || 5000),
  MONGO_URI: process.env.MONGO_URI || process.env.MONGO_DB_URI || "",
  DATABASE_NAME: process.env.DATABASE_NAME || "warranty_ops_db",
  JWT_SECRET: process.env.JWT_SECRET || "warrantyops_jwt_access_secret_key_2026",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "warrantyops_jwt_refresh_secret_key_2026",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
};
