import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Meeting from "@/models/Meeting";
import Post from "@/models/Post";
import { authOptions } from "@/lib/auth";

const CAN_EDIT = ["회장", "부회장", "서기", "동아리 전담 멘토"];

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  const filter: Record<string, unknown> = {};
  if (year && month) {
    const start = new Date(Number(year), Number(month) - 1, 1);
    const end = new Date(Number(year), Number(month), 1);
    filter.date = { $gte: start, $lt: end };
  } else if (year) {
    const start = new Date(Number(year), 0, 1);
    const end = new Date(Number(year) + 1, 0, 1);
    filter.date = { $gte: start, $lt: end };
  }

  const meetings = await Meeting.find(filter)
    .populate("participantIds", "name role")
    .sort({ date: -1 })
    .lean();

  return NextResponse.json(meetings);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const role = (session.user as any).role;
  if (!CAN_EDIT.includes(role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  await connectDB();
  const { title, notes, date, time, locationOrLink, participantIds, imageUrl } = await req.json();

  if (!title || !date) {
    return NextResponse.json({ error: "제목과 날짜는 필수입니다." }, { status: 400 });
  }

  const meetingDate = time ? new Date(`${date}T${time}:00`) : new Date(date);

  const meeting = await Meeting.create({
    title,
    notes: notes ?? "",
    date: meetingDate,
    locationOrLink: locationOrLink ?? "",
    participantIds: participantIds ?? [],
    imageUrl: imageUrl ?? "",
    status: "완료",
  });

  // 대시보드 피드에 노출될 Post 생성
  await Post.create({
    title: `[회의록] ${title}`,
    content: notes ?? "",
    postStatusMessage: "회의록 업데이트",
    category: "회의",
    meetingId: meeting._id,
    authorId: (session.user as any).id,
  });

  const populated = await Meeting.findById(meeting._id)
    .populate("participantIds", "name role")
    .lean();

  return NextResponse.json(populated, { status: 201 });
}
