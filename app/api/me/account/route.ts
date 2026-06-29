import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  await connectDB();
  const { action, username, currentPassword, newPassword } = await req.json();
  const userId = (session.user as any).id;

  // 아이디 변경
  if (action === "changeUsername") {
    if (!username?.trim()) {
      return NextResponse.json({ error: "아이디를 입력해주세요." }, { status: 400 });
    }
    const duplicate = await User.findOne({ username: username.trim(), _id: { $ne: userId } });
    if (duplicate) {
      return NextResponse.json({ error: "이미 사용 중인 아이디입니다." }, { status: 409 });
    }
    await User.findByIdAndUpdate(userId, { username: username.trim() });
    return NextResponse.json({ message: "아이디가 변경되었습니다." });
  }

  // 비밀번호 변경
  if (action === "changePassword") {
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "모든 필드를 입력해주세요." }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "새 비밀번호는 6자 이상이어야 합니다." }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "현재 비밀번호가 올바르지 않습니다." }, { status: 400 });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(userId, { passwordHash: hash });
    return NextResponse.json({ message: "비밀번호가 변경되었습니다." });
  }

  return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
}
