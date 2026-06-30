import mongoose from "mongoose";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

let cached = (global as any).mongoose ?? { conn: null, promise: null };
(global as any).mongoose = cached;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI가 설정되지 않았습니다.");
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri).then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
