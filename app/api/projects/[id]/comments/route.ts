import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Post from "@/models/Post";
import Comment from "@/models/Comment";
import { authOptions } from "@/lib/auth";
import { sendPushToUsers } from "@/lib/sendPush";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const posts = await Post.find({ projectId: params.id }).select("_id");
  const postIds = posts.map((p) => p._id);
  const comments = await Comment.find({ postId: { $in: postIds } })
    .populate("userId", "name avatar portfolioSlug")
    .sort({ createdAt: 1 });
  return NextResponse.json(comments);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { content, postId } = await req.json();
  if (!content || !postId) {
    return NextResponse.json({ error: "내용과 postId는 필수입니다." }, { status: 400 });
  }

  await connectDB();
  const post = await Post.findOne({ _id: postId, projectId: params.id });
  if (!post) return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });

  const userId = (session.user as any).id;

  const comment = await Comment.create({
    postId,
    userId,
    content,
  });

  await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

  const populated = await comment.populate("userId", "name avatar portfolioSlug");

  if (post.authorId?.toString() !== userId) {
    sendPushToUsers([post.authorId.toString()], {
      title: "새 댓글",
      body: `${(session.user as any).name ?? "누군가"}님이 댓글을 남겼습니다: ${content.slice(0, 40)}`,
      url: `/projects/${params.id}`,
      tag: "comment",
    }).catch(() => {});
  }

  return NextResponse.json(populated, { status: 201 });
}
