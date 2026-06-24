import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { authOptions } from "@/lib/auth";
import { isLeadership } from "@/lib/roles";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !isLeadership((session.user as any).role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  await connectDB();
  const { name, role } = await req.json();

  const validRoles = ["회장", "부회장", "관리자", "서기", "동아리 전담 멘토", "부원"];
  const updateData: Record<string, string> = {};
  if (name?.trim()) updateData.name = name.trim();
  if (role && validRoles.includes(role)) updateData.role = role;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "변경할 내용이 없습니다." }, { status: 400 });
  }

  const user = await User.findByIdAndUpdate(params.id, updateData, { new: true }).select("-passwordHash");
  if (!user) return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });

  return NextResponse.json(user);
}
