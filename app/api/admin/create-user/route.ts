import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { authOptions } from "@/lib/auth";
import { sendPushToAll } from "@/lib/sendPush";

export const dynamic = "force-dynamic";


export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || !["회장", "부회장"].includes(role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { name, email, password, role: newRole } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  await connectDB();
  const existing = await User.findOne({ email });
  if (existing) {
    return NextResponse.json({ error: "이미 존재하는 이메일입니다." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const slug = email.split("@")[0] + "-" + Date.now();

  const validRoles = ["회장", "부회장", "관리자", "서기", "동아리 전담 멘토", "부원"];
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: validRoles.includes(newRole) ? newRole : "부원",
    portfolioSlug: slug,
  });

  sendPushToAll(
    {
      title: "새로운 부원 가입",
      body: `${name}님이 합류했습니다`,
      url: "/members",
      tag: "new-member",
    },
    (session?.user as any)?.id
  ).catch(() => {});

  return NextResponse.json({ id: user._id, name: user.name, email: user.email });
}
