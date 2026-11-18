import mongoose from "mongoose";
import { env } from "./env.js";

export const CONNECT_DB = async () => {
  if (!env.MONGO_URI) {
    throw new Error("MONGO_URI is required in environment variables");
  }

  await mongoose.connect(env.MONGO_URI, {
    dbName: env.DATABASE_NAME,
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`✅ Connected to MongoDB (${env.DATABASE_NAME})`);
};

export const CLOSE_DB = async () => {
  await mongoose.connection.close();
};

export const IS_DB_CONNECTED = () => mongoose.connection.readyState === 1;
