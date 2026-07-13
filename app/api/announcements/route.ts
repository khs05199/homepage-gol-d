import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Post from "@/models/Post";
import { authOptions } from "@/lib/auth";
import { isLeadership } from "@/lib/roles";

export const dynamic = "force-dynamic";


export async function GET() {
  await connectDB();
  const posts = await Post.find({ category: "공지" })
    .populate("authorId", "name avatar username role")
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (!isLeadership((session.user as any).role))
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  await connectDB();
  const { title, content, postStatusMessage } = await req.json();
  if (!title || !content)
    return NextResponse.json({ error: "제목과 내용은 필수입니다." }, { status: 400 });
  if (!postStatusMessage?.trim())
    return NextResponse.json({ error: "상태 메세지는 필수입니다." }, { status: 400 });

  const post = await Post.create({
    title,
    content,
    postStatusMessage: postStatusMessage.slice(0, 15),
    category: "공지",
    authorId: (session.user as any).id,
  });

  const populated = await post.populate("authorId", "name avatar username role");

  return NextResponse.json(populated, { status: 201 });
}
