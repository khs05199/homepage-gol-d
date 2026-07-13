import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Post from "@/models/Post";
import Comment from "@/models/Comment";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const comments = await Comment.find({ postId: params.id })
    .populate("userId", "name avatar portfolioSlug username")
    .sort({ createdAt: 1 });
  return NextResponse.json(comments);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { content } = await req.json();
  if (!content) {
    return NextResponse.json({ error: "내용은 필수입니다." }, { status: 400 });
  }

  await connectDB();
  const post = await Post.findById(params.id);
  if (!post) return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });

  const comment = await Comment.create({
    postId: params.id,
    userId: (session.user as any).id,
    content,
  });

  await Post.findByIdAndUpdate(params.id, { $inc: { commentCount: 1 } });

  const populated = await comment.populate("userId", "name avatar portfolioSlug username");
  return NextResponse.json(populated, { status: 201 });
}
