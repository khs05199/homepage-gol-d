import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = "force-dynamic";


export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ count: 0, users: [] }, { status: 401 });

  await connectDB();
  const since = new Date(Date.now() - 90 * 1000);

  const users = await User.find({ lastSeen: { $gte: since } })
    .select("name avatar role")
    .lean();

  return NextResponse.json({ count: users.length, users });
}
