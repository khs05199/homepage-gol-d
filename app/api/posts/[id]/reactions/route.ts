import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Post from "@/models/Post";
import Reaction from "@/models/Reaction";
import { authOptions } from "@/lib/auth";

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
    ).select("reactions");
    return NextResponse.json({ action: "added", reactions: post?.reactions });
  }
}
