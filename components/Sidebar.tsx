"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, FolderOpen, ShieldCheck,
  Settings, BookOpen, Archive, CalendarDays,
} from "lucide-react";

const NAV_TOP = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/members", label: "부원 관리", icon: Users },
  { href: "/projects", label: "프로젝트", icon: FolderOpen },
];

const NAV_CLUB = [
  { href: "/club-info", label: "동아리 정보", icon: BookOpen },
  { href: "/resources", label: "자료실", icon: Archive, hasNew: true },
  { href: "/schedule", label: "일정 및 공지", icon: CalendarDays },
];

const NAV_BOTTOM = [
  { href: "/admin", label: "운영진", icon: ShieldCheck, leaderOnly: true },
  { href: "/me", label: "설정", icon: Settings },
];

const VALUES = ["동반성장", "소통과 공유", "도전 우선주의"];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const isLeader = ["회장", "부회장", "관리자"].includes(role);

  const [resourceHasNew, setResourceHasNew] = useState(false);

  useEffect(() => {
    fetch("/api/resources/new-status")
      .then((r) => r.json())
      .then((d) => setResourceHasNew(d.hasAnyNew ?? false))
      .catch(() => {});
  }, []);

  function NavLink({
    href, label, icon: Icon, showNew,
  }: { href: string; label: string; icon: any; showNew?: boolean }) {
    const active = pathname === href || (href !== "/" && pathname.startsWith(href));
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          active
            ? "text-yellow-300"
            : "text-gray-400 hover:text-white hover:bg-white/5"
        }`}
        style={active ? { backgroundColor: "rgba(212,160,23,0.12)" } : {}}
      >
        <Icon size={16} className={active ? "text-yellow-400" : ""} />
        <span className="flex-1">{label}</span>
        {showNew && resourceHasNew && (
          <span className="text-[9px] font-bold text-white bg-red-500 rounded-full w-4 h-4 flex items-center justify-center">
            N
          </span>
        )}
      </Link>
    );
  }

  return (
    <aside
      className="fixed top-0 left-0 h-screen w-64 flex flex-col z-40 border-r border-white/5"
      style={{ backgroundColor: "#0f1117" }}
    >
      {/* Logo & Core Values */}
      <div className="px-6 pt-8 pb-6">
        <p className="text-[10px] tracking-[0.2em] text-yellow-400/60 uppercase mb-2">
          AI • BIGDATA
        </p>
        <h1 className="text-4xl font-black tracking-tight gold-text leading-none mb-5">
          GOL:D
        </h1>
        <div className="space-y-2">
          {VALUES.map((v) => (
            <p key={v} className="text-xs text-yellow-300/60 flex items-center gap-2">
              <span className="text-yellow-400 text-[7px]">◆</span>
              {v}
            </p>
          ))}
        </div>
      </div>

      <div className="mx-5 h-px bg-white/8" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-0.5">
        {/* 메인 */}
        {NAV_TOP.map(({ href, label, icon }) => (
          <NavLink key={href} href={href} label={label} icon={icon} />
        ))}

        {/* 동아리 섹션 구분선 */}
        <div className="px-3 pt-4 pb-1">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">동아리</p>
        </div>

        {NAV_CLUB.map(({ href, label, icon, hasNew }) => (
          <NavLink key={href} href={href} label={label} icon={icon} showNew={hasNew} />
        ))}

        {/* 관리 섹션 */}
        <div className="px-3 pt-4 pb-1">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">관리</p>
        </div>

        {NAV_BOTTOM.map(({ href, label, icon, leaderOnly }) => {
          if (leaderOnly && !isLeader) return null;
          return <NavLink key={href} href={href} label={label} icon={icon} />;
        })}
      </nav>

      {/* User */}
      <div className="px-5 py-5 border-t border-white/8">
        <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1.5">
          로그인 정보
        </p>
        <Link
          href="/me"
          className="text-sm text-white font-medium hover:text-yellow-300 transition-colors"
        >
          {session?.user?.name ?? "..."}
        </Link>
        {role && (
          <span className="ml-2 text-[10px] text-gray-500">({role})</span>
        )}
        <br />
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-xs text-gray-500 hover:text-yellow-400 mt-1 transition-colors"
        >
          로그아웃
        </button>
      </div>
    </aside>
  );
}
