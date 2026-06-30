import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";


export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  await connectDB();
  const users = await User.find()
    .select("name role avatar portfolioSlug username")
    .sort({ name: 1 })
    .lean();

  return NextResponse.json(users);
}
