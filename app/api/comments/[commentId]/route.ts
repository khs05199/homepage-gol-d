import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Comment from "@/models/Comment";
import Post from "@/models/Post";
import { authOptions } from "@/lib/auth";

export async function DELETE(_: NextRequest, { params }: { params: { commentId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  await connectDB();
  const comment = await Comment.findById(params.commentId);
  if (!comment) return NextResponse.json({ error: "댓글을 찾을 수 없습니다." }, { status: 404 });

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  if (comment.userId.toString() !== userId && !["회장", "부회장"].includes(role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  await comment.deleteOne();
  await Post.findByIdAndUpdate(comment.postId, { $inc: { commentCount: -1 } });

  return NextResponse.json({ message: "삭제되었습니다." });
}
