"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from(Array.from(rawData).map((c) => c.charCodeAt(0)));
}

export default function NotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const ua = navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const standalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;
    const canPush = "serviceWorker" in navigator && "PushManager" in window;

    setIsIOS(iOS);
    setIsStandalone(standalone);
    setSupported(canPush);

    if (canPush) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(async (reg) => {
          const sub = await reg.pushManager.getSubscription();
          setSubscribed(!!sub);
        })
        .catch(() => {});
    }
  }, []);

  async function handleSubscribe() {
    setLoading(true);
    setMsg("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMsg("알림 권한이 거부되었습니다.");
        setLoading(false);
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) {
        await sub.unsubscribe();
        setMsg("알림 등록에 실패했습니다.");
        setLoading(false);
        return;
      }
      setSubscribed(true);
      setMsg("알림이 켜졌습니다.");
    } catch {
      setMsg("알림 설정에 실패했습니다.");
    }
    setLoading(false);
  }

  async function handleUnsubscribe() {
    setLoading(true);
    setMsg("");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      setMsg("알림이 꺼졌습니다.");
    } catch {
      setMsg("알림 해제에 실패했습니다.");
    }
    setLoading(false);
  }

  async function handleTest() {
    setMsg("");
    const res = await fetch("/api/push/test", { method: "POST" });
    const data = await res.json();
    setMsg(res.ok ? data.message : data.error);
  }

  // iOS Safari는 홈 화면에 추가(PWA)하기 전까지 웹 푸시 자체를 지원하지 않음
  if (isIOS && !isStandalone) {
    return (
      <div className="px-3 py-2.5 text-[11px] text-gray-400 leading-relaxed">
        <p className="flex items-center gap-2 text-gray-300 font-medium mb-1">
          <BellOff size={14} /> 알림을 받으려면
        </p>
        <p>Safari 공유 버튼 → &quot;홈 화면에 추가&quot;로 설치한 뒤 다시 접속해주세요.</p>
      </div>
    );
  }

  if (!supported) return null;

  return (
    <div className="px-3 py-1">
      <button
        onClick={subscribed ? handleUnsubscribe : handleSubscribe}
        disabled={loading}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all w-full disabled:opacity-50"
      >
        {subscribed ? <BellRing size={16} className="text-yellow-400" /> : <Bell size={16} />}
        <span>{subscribed ? "알림 켜짐" : "알림 받기"}</span>
      </button>
      {subscribed && (
        <button
          onClick={handleTest}
          className="text-[11px] text-gray-500 hover:text-gray-300 px-3 pb-1 transition-colors"
        >
          테스트 알림 보내기
        </button>
      )}
      {msg && <p className="text-[11px] text-gray-500 px-3 pb-1">{msg}</p>}
    </div>
  );
}
