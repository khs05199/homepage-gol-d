"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    } else {
      router.push("/");
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#0f1117" }}>
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 px-16 py-14">
        <div>
          <p className="text-[11px] tracking-[0.25em] text-yellow-400/60 uppercase mb-3">
            AI • BIGDATA
          </p>
          <h1 className="text-7xl font-black gold-text leading-none mb-6">GOL:D</h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-sm">
            데이터를 분석하여<br />
            <span className="text-yellow-300/80">금과 같은 가치</span>를 발견하자
          </p>
        </div>

        <div className="space-y-4">
          {[
            { title: "동반성장", desc: "함께 배우고 함께 성장하는 문화" },
            { title: "소통과 공유", desc: "지식과 경험을 자유롭게 나누는 공간" },
            { title: "도전 우선주의", desc: "실패를 두려워하지 않는 도전 정신" },
          ].map((v) => (
            <div key={v.title} className="flex items-start gap-3">
              <span className="text-yellow-400 text-xs mt-1">◆</span>
              <div>
                <p className="text-yellow-300/90 text-sm font-semibold">{v.title}</p>
                <p className="text-gray-500 text-xs mt-0.5">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-gray-600 text-xs">© 2025 GOL:D 동아리</p>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center px-8 py-14">
        <div className="w-full max-w-sm">
          {/* Mobile only logo */}
          <div className="lg:hidden mb-10 text-center">
            <h1 className="text-5xl font-black gold-text">GOL:D</h1>
            <p className="text-gray-500 text-sm mt-1">AI • BIGDATA 동아리</p>
          </div>

          <div
            className="rounded-2xl p-8 border border-white/8"
            style={{ backgroundColor: "#1a1f2e" }}
          >
            <h2 className="text-white text-xl font-bold mb-1">로그인</h2>
            <p className="text-gray-500 text-sm mb-8">동아리 계정으로 로그인하세요</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                  아이디 또는 이메일
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hs.kwon 또는 example@email.com"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-yellow-400/50 focus:bg-white/8 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                  비밀번호
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-yellow-400/50 focus:bg-white/8 transition-all"
                />
              </div>

              {error && (
                <p className="text-red-400 text-xs bg-red-400/10 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm text-gray-900 transition-all mt-2 disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #D4A017 0%, #F5C518 100%)",
                }}
              >
                {loading ? "로그인 중..." : "로그인"}
              </button>
            </form>

            <p className="text-center text-gray-600 text-xs mt-6">
              관리자 문의: admin@gold.club
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
