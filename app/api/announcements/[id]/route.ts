import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Post from "@/models/Post";
import { authOptions } from "@/lib/auth";
import { isLeadership } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!isLeadership((session?.user as any)?.role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  await connectDB();
  const body = await req.json();
  const post = await Post.findOneAndUpdate(
    { _id: params.id, category: "공지" },
    body,
    { new: true }
  );
  if (!post) return NextResponse.json({ error: "공지사항을 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json(post);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!isLeadership((session?.user as any)?.role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  await connectDB();
  await Post.findOneAndDelete({ _id: params.id, category: "공지" });
  return NextResponse.json({ message: "삭제되었습니다." });
}
