"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const isLeadership = ["회장", "부회장"].includes(role);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-lg text-gray-900 tracking-tight">
            GOL:D
          </Link>
          <Link href="/projects" className="text-sm text-gray-600 hover:text-gray-900">
            프로젝트
          </Link>
          <Link href="/members" className="text-sm text-gray-600 hover:text-gray-900">
            부원
          </Link>
          {isLeadership && (
            <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
              운영진
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <Link href="/me" className="text-sm text-gray-600 hover:text-gray-900">
                {session.user?.name}
              </Link>
              <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
                로그아웃
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button size="sm">로그인</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
