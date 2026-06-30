import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";


export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  await connectDB();
  const user = await User.findById((session.user as any).id).select("-passwordHash");
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const allowed = ["name", "statusMessage", "bio", "skills", "avatar"];
  const update: any = {};
  allowed.forEach((k) => { if (body[k] !== undefined) update[k] = body[k]; });

  const user = await User.findByIdAndUpdate((session.user as any).id, update, { new: true }).select("-passwordHash");
  return NextResponse.json(user);
}
