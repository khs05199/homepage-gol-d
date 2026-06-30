import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import PushSubscription from "@/models/PushSubscription";
import webpush from "web-push";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL;

  if (!publicKey || !privateKey || !email) {
    return NextResponse.json({
      error: "VAPID 환경변수 미설정",
      missing: { publicKey: !publicKey, privateKey: !privateKey, email: !email },
    }, { status: 500 });
  }

  webpush.setVapidDetails(email, publicKey, privateKey);

  await connectDB();
  const userId = (session.user as any).id;
  const subs = await PushSubscription.find({ userId }).lean();

  if (subs.length === 0) {
    return NextResponse.json({ error: "저장된 구독 없음 — 사이드바에서 알림 받기를 먼저 클릭하세요" }, { status: 404 });
  }

  const results: { endpoint: string; ok: boolean; error?: string }[] = [];

  for (const sub of subs as any[]) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
        JSON.stringify({ title: "GOL:D 테스트 알림 ✅", body: "알림이 정상 작동합니다!", url: "/" })
      );
      results.push({ endpoint: sub.endpoint.slice(0, 40) + "...", ok: true });
    } catch (err: any) {
      results.push({ endpoint: sub.endpoint.slice(0, 40) + "...", ok: false, error: err?.message ?? String(err) });
    }
  }

  return NextResponse.json({ subscriptions: subs.length, results });
}
