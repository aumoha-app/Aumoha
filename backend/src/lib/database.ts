import mongoose from 'mongoose';

let pendingConnection: Promise<typeof mongoose> | undefined;

// Share the first connection attempt across concurrent serverless requests.
export async function connectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Database is not configured');
  if (!pendingConnection) {
    pendingConnection = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      maxPoolSize: 5,
    }).finally(() => { pendingConnection = undefined; });
  }
  await pendingConnection;
}
