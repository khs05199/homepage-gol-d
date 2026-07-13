import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import PushSubscription from "@/models/PushSubscription";
import { authOptions } from "@/lib/auth";
import { sendPushToUsers } from "@/lib/sendPush";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const userId = (session.user as any).id;

  await connectDB();
  const count = await PushSubscription.countDocuments({ userId });
  if (count === 0) {
    return NextResponse.json(
      { error: "등록된 구독이 없습니다. 먼저 알림을 켜주세요." },
      { status: 400 }
    );
  }

  await sendPushToUsers([userId], {
    title: "GOL:D 테스트 알림",
    body: "알림이 정상적으로 도착했습니다 🎉",
    url: "/",
    tag: "test-notification",
  });

  return NextResponse.json({ message: `${count}개 기기로 테스트 알림을 발송했습니다.` });
}
