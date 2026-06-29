import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Meeting from "@/models/Meeting";
import Post from "@/models/Post";
import { authOptions } from "@/lib/auth";

const CAN_EDIT = ["회장", "부회장", "서기", "동아리 전담 멘토"];

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const meeting = await Meeting.findById(params.id)
    .populate("participantIds", "name role")
    .lean();
  if (!meeting) return NextResponse.json({ error: "찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json(meeting);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const role = (session.user as any).role;
  if (!CAN_EDIT.includes(role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  await connectDB();
  const body = await req.json();

  const update: Record<string, unknown> = {};
  const allowed = ["title", "notes", "locationOrLink", "participantIds", "imageUrl", "status"];
  allowed.forEach((k) => { if (body[k] !== undefined) update[k] = body[k]; });

  if (body.date && body.time) {
    update.date = new Date(`${body.date}T${body.time}:00`);
  } else if (body.date) {
    update.date = new Date(body.date);
  }

  const meeting = await Meeting.findByIdAndUpdate(params.id, update, { new: true })
    .populate("participantIds", "name role")
    .lean();

  if (!meeting) return NextResponse.json({ error: "찾을 수 없습니다." }, { status: 404 });

  // 기존 대시보드 Post 업데이트 (없으면 새로 생성)
  const existingPost = await Post.findOne({ meetingId: params.id, category: "회의" });
  if (existingPost) {
    await Post.findByIdAndUpdate(existingPost._id, {
      title: `[회의록] ${(meeting as any).title}`,
      content: (update.notes as string) ?? (meeting as any).notes ?? "",
      postStatusMessage: "회의록 업데이트",
      createdAt: new Date(),
    });
  } else {
    await Post.create({
      title: `[회의록] ${(meeting as any).title}`,
      content: (update.notes as string) ?? (meeting as any).notes ?? "",
      postStatusMessage: "회의록 업데이트",
      category: "회의",
      meetingId: params.id,
      authorId: (session.user as any).id,
    });
  }

  return NextResponse.json(meeting);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const role = (session.user as any).role;
  if (!CAN_EDIT.includes(role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  await connectDB();
  await Meeting.findByIdAndDelete(params.id);
  await Post.deleteMany({ meetingId: params.id, category: "회의" });

  return NextResponse.json({ message: "삭제되었습니다." });
}
