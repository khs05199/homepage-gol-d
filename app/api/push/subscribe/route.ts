import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import PushSubscription from "@/models/PushSubscription";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { endpoint, keys } = await req.json();
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "잘못된 구독 정보입니다." }, { status: 400 });
  }

  await connectDB();
  await PushSubscription.findOneAndUpdate(
    { endpoint },
    { endpoint, keys, userId: (session.user as any).id },
    { upsert: true, new: true }
  );

  return NextResponse.json({ message: "구독 완료" }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { endpoint } = await req.json();
  if (!endpoint) return NextResponse.json({ error: "endpoint는 필수입니다." }, { status: 400 });

  await connectDB();
  await PushSubscription.deleteOne({ endpoint, userId: (session.user as any).id });

  return NextResponse.json({ message: "구독 해제 완료" });
}
