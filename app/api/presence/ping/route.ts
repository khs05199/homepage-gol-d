import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  await connectDB();
  await User.findByIdAndUpdate((session.user as any).id, { lastSeen: new Date() });

  return NextResponse.json({ ok: true });
}
