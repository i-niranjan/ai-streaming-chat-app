import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI");
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = global as typeof globalThis & {
  mongoose?: MongooseCache;
};

let cached = globalWithMongoose.mongoose;

if (!cached) {
  cached = globalWithMongoose.mongoose = {
    conn: null,
    promise: null,
  };
}

const mongooseCache = cached;

export async function connectDB() {
  if (mongooseCache.conn) return mongooseCache.conn;

  if (!mongooseCache.promise) {
    mongooseCache.promise = mongoose.connect(MONGODB_URI, {
      dbName: "ai_streaming_chat",
    });
  }
  mongooseCache.conn = await mongooseCache.promise;

  return mongooseCache.conn;
}
