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
  const comments = await Comment.find({ postId: params.id })
    .populate("userId", "name avatar portfolioSlug username")
    .sort({ createdAt: 1 });
  return NextResponse.json(comments);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { content, materialId } = await req.json();
  if (!content) {
    return NextResponse.json({ error: "내용은 필수입니다." }, { status: 400 });
  }

  await connectDB();
  const post = await Post.findById(params.id).populate("projectId", "type");
  if (!post) return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });

  const userId = (session.user as any).id;

  const comment = await Comment.create({
    postId: params.id,
    materialId: materialId ?? null,
    userId,
    content,
  });

  await Post.findByIdAndUpdate(params.id, { $inc: { commentCount: 1 } });

  const populated = await comment.populate("userId", "name avatar portfolioSlug username");

  if (post.authorId?.toString() !== userId) {
    const proj = post.projectId as any;
    const url = proj?._id
      ? proj.type === "논문"
        ? `/projects/${proj._id}/logs/${post._id}#material-${materialId ?? "main"}`
        : `/projects/${proj._id}`
      : post.meetingId
      ? "/meetings"
      : "/";

    sendPushToUsers([post.authorId.toString()], {
      title: "새 댓글",
      body: `${(session.user as any).name ?? "누군가"}님이 댓글을 남겼습니다: ${content.slice(0, 40)}`,
      url,
      tag: "comment",
    }).catch(() => {});
  }

  return NextResponse.json(populated, { status: 201 });
}
