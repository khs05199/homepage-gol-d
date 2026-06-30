import webpush from "web-push";
import { connectDB } from "./mongodb";
import PushSubscription from "@/models/PushSubscription";

export async function sendPushToAll(payload: {
  title: string;
  body: string;
  url?: string;
}) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL;

  if (!publicKey || !privateKey || !email) {
    console.error("[sendPush] VAPID 환경변수 미설정:", { publicKey: !!publicKey, privateKey: !!privateKey, email: !!email });
    return;
  }

  webpush.setVapidDetails(email, publicKey, privateKey);

  await connectDB();
  const subs = await PushSubscription.find({}).lean();
  if (subs.length === 0) {
    console.log("[sendPush] 구독자 없음");
    return;
  }

  console.log(`[sendPush] ${subs.length}명에게 전송 시작:`, payload.title);
  const expiredEndpoints: string[] = [];

  await Promise.allSettled(
    subs.map(async (sub: any) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
          JSON.stringify(payload)
        );
        console.log("[sendPush] 전송 성공:", sub.endpoint.slice(0, 40));
      } catch (err: any) {
        console.error("[sendPush] 전송 실패:", err?.statusCode, err?.message);
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          expiredEndpoints.push(sub.endpoint);
        }
      }
    })
  );

  if (expiredEndpoints.length > 0) {
    await PushSubscription.deleteMany({ endpoint: { $in: expiredEndpoints } });
  }
}
