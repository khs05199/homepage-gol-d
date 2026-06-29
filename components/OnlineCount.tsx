"use client";

import { useEffect, useState } from "react";

interface OnlineUser {
  _id: string;
  name: string;
  avatar: string;
  role: string;
}

export default function OnlineCount() {
  const [count, setCount] = useState(0);
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [showTooltip, setShowTooltip] = useState(false);

  async function ping() {
    await fetch("/api/presence/ping", { method: "POST" }).catch(() => {});
  }

  async function fetchCount() {
    const res = await fetch("/api/presence/count").catch(() => null);
    if (!res?.ok) return;
    const data = await res.json();
    setCount(data.count ?? 0);
    setUsers(data.users ?? []);
  }

  useEffect(() => {
    ping();
    fetchCount();

    const interval = setInterval(() => {
      ping();
      fetchCount();
    }, 30_000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative px-3 py-2">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex items-center gap-2 w-full"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span className="text-xs text-gray-400">
          지금 접속 중 <span className="text-green-400 font-bold">{count}명</span>
        </span>
      </button>

      {showTooltip && users.length > 0 && (
        <div
          className="absolute bottom-full left-3 mb-2 w-44 rounded-xl p-3 z-50 shadow-xl"
          style={{ background: "#1a1d27", border: "1px solid rgba(255,215,0,0.2)" }}
        >
          <p className="text-[10px] text-yellow-400 font-bold mb-2 uppercase tracking-wider">
            접속 중인 부원
          </p>
          <div className="space-y-1.5">
            {users.map((u) => {
              const initials = (u.name ?? "?")[0].toUpperCase();
              return (
                <div key={u._id} className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-gray-900 flex-shrink-0 overflow-hidden"
                    style={{ background: "linear-gradient(135deg, #D4A017, #F5C518)" }}
                  >
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <span className="text-xs text-gray-300 truncate">{u.name}</span>
                  <span className="text-[9px] text-gray-500 shrink-0 ml-auto">{u.role}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
