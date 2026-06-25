import mongoose from 'mongoose';

const CONNECTED = mongoose.ConnectionStates.connected;

/**
 * Cached connection handle.
 *
 * Serverless functions are stateless — each cold start creates a new module
 * context. By caching the Mongoose connection on the `global` object we reuse
 * the same TCP connection across multiple warm invocations of the same
 * function instance, dramatically reducing latency and Atlas connection count.
 */

declare global {
  // eslint-disable-next-line no-var
  var __mongooseConn: typeof mongoose | undefined;
}

let isConnecting = false;

export async function connectDB(): Promise<boolean> {
  // 1. Already connected — reuse.
  if (mongoose.connection.readyState === CONNECTED) {
    return true;
  }

  // 2. Cached connection from a previous warm invocation.
  if (global.__mongooseConn && global.__mongooseConn.connection.readyState === CONNECTED) {
    return true;
  }

  // 3. Guard against race conditions when multiple requests hit a cold start.
  if (isConnecting) {
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (!isConnecting) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
    return isDbConnected();
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.warn(
      '[DB] MONGO_URI is not defined — database operations will fail. ' +
      'Falling back to in-memory / seed data.'
    );
    return false;
  }

  try {
    isConnecting = true;
    await mongoose.connect(mongoUri, {
      bufferCommands: false, // Fail fast on serverless rather than queuing
    });
    global.__mongooseConn = mongoose;
    console.log('[DB] MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('[DB] Connection error:', error);
    return false;
  } finally {
    isConnecting = false;
  }
}

/** Returns true when Mongoose reports an active connection. */
export const isDbConnected = (): boolean =>
  mongoose.connection.readyState === CONNECTED;
