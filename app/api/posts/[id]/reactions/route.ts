import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Post from "@/models/Post";
import Reaction from "@/models/Reaction";
import { authOptions } from "@/lib/auth";
import { sendPushToUsers } from "@/lib/sendPush";

const REACTION_LABEL: Record<string, string> = {
  check: "체크",
  thumbsup: "좋아요",
  heart: "하트",
};

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { reactionType } = await req.json();
  if (!["check", "thumbsup", "heart"].includes(reactionType)) {
    return NextResponse.json({ error: "유효하지 않은 반응입니다." }, { status: 400 });
  }

  const userId = (session.user as any).id;
  await connectDB();

  const existing = await Reaction.findOne({ postId: params.id, userId, reactionType });
  const field = `reactions.${reactionType}`;

  if (existing) {
    await existing.deleteOne();
    const post = await Post.findByIdAndUpdate(
      params.id,
      { $inc: { [field]: -1 } },
      { new: true }
    ).select("reactions");
    return NextResponse.json({ action: "removed", reactions: post?.reactions });
  } else {
    await Reaction.create({ postId: params.id, userId, reactionType });
    const post = await Post.findByIdAndUpdate(
      params.id,
      { $inc: { [field]: 1 } },
      { new: true }
    )
      .select("reactions authorId projectId meetingId")
      .populate("projectId", "type");

    if (post && post.authorId?.toString() !== userId) {
      const proj = post.projectId as any;
      const url = proj?._id
        ? proj.type === "논문"
          ? `/projects/${proj._id}/logs/${post._id}`
          : `/projects/${proj._id}`
        : post.meetingId
        ? "/meetings"
        : "/";

      sendPushToUsers([post.authorId.toString()], {
        title: "새 반응",
        body: `${(session.user as any).name ?? "누군가"}님이 ${REACTION_LABEL[reactionType]} 반응을 남겼습니다`,
        url,
        tag: "reaction",
      }).catch(() => {});
    }

    return NextResponse.json({ action: "added", reactions: post?.reactions });
  }
}
