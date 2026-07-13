import webpush from "web-push";
import { connectDB } from "./mongodb";
import PushSubscription from "@/models/PushSubscription";

type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag?: string;
};

let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    console.warn("[sendPush] VAPID 환경변수 미설정 — 푸시 발송을 건너뜁니다.");
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

async function sendToSubscriptionDocs(subs: any[], payload: PushPayload) {
  const body = JSON.stringify(payload);
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          body
        );
      } catch (err: any) {
        // 구독이 만료/취소된 경우(404, 410) DB에서 정리
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: sub._id }).catch(() => {});
        } else {
          console.error("[sendPush] 발송 실패:", err?.statusCode, err?.body ?? err);
        }
      }
    })
  );
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  if (!ensureVapidConfigured() || userIds.length === 0) return;
  await connectDB();
  const subs = await PushSubscription.find({ userId: { $in: userIds } }).lean();
  await sendToSubscriptionDocs(subs, payload);
}

export async function sendPushToAll(payload: PushPayload, excludeUserId?: string) {
  if (!ensureVapidConfigured()) return;
  await connectDB();
  const filter = excludeUserId ? { userId: { $ne: excludeUserId } } : {};
  const subs = await PushSubscription.find(filter).lean();
  await sendToSubscriptionDocs(subs, payload);
}
