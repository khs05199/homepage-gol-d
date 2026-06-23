import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import ClubInfo from "@/models/ClubInfo";
import { authOptions } from "@/lib/auth";
import { isLeadership } from "@/lib/roles";

export async function GET() {
  await connectDB();
  const info = await ClubInfo.findOne().populate("updatedBy", "name").lean();
  return NextResponse.json(info ?? {});
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (!isLeadership((session.user as any).role))
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  await connectDB();
  const body = await req.json();
  const userId = (session.user as any).id;

  const info = await ClubInfo.findOneAndUpdate(
    {},
    { ...body, updatedAt: new Date(), updatedBy: userId },
    { upsert: true, new: true }
  );
  return NextResponse.json(info);
}
