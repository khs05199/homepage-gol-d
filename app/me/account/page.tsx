"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/PageLayout";
import { Eye, EyeOff } from "lucide-react";

const inputClass =
  "w-full px-4 py-3.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-300 text-sm focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition-all";

function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        placeholder={placeholder}
        className={`${inputClass} pr-11`}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export default function AccountPage() {
  const { status } = useSession();
  const router = useRouter();

  // 아이디
  const [username, setUsername] = useState("");
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameMsg, setUsernameMsg] = useState("");
  const [usernameErr, setUsernameErr] = useState("");

  // 비밀번호
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/users/me")
        .then((r) => r.json())
        .then((u) => setUsername(u.username ?? ""));
    }
  }, [status]);

  async function handleUsernameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUsernameMsg("");
    setUsernameErr("");
    if (!username.trim()) {
      setUsernameErr("아이디를 입력해주세요.");
      return;
    }
    setUsernameLoading(true);
    const res = await fetch("/api/me/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "changeUsername", username }),
    });
    const data = await res.json();
    setUsernameLoading(false);
    if (!res.ok) {
      setUsernameErr(data.error ?? "오류가 발생했습니다.");
    } else {
      setUsernameMsg(data.message);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg("");
    setPwErr("");
    if (pwForm.next !== pwForm.confirm) {
      setPwErr("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    setPwLoading(true);
    const res = await fetch("/api/me/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "changePassword",
        currentPassword: pwForm.current,
        newPassword: pwForm.next,
      }),
    });
    const data = await res.json();
    setPwLoading(false);
    if (!res.ok) {
      setPwErr(data.error ?? "오류가 발생했습니다.");
    } else {
      setPwMsg(data.message);
      setPwForm({ current: "", next: "", confirm: "" });
    }
  }

  return (
    <PageLayout>
      <main className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">아이디 · 비밀번호 변경</h1>

        {/* 아이디 변경 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-5">
          <h2 className="text-base font-bold text-gray-800 mb-1">아이디 변경</h2>
          <p className="text-xs text-gray-400 mb-6">
            로그인 시 이메일 대신 사용할 아이디를 설정합니다.
          </p>

          <form onSubmit={handleUsernameSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">아이디</label>
              <input
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameMsg("");
                  setUsernameErr("");
                }}
                required
                placeholder="영문, 숫자, 점(.) 사용 가능"
                className={inputClass}
              />
            </div>

            {usernameErr && (
              <p className="text-red-500 text-sm bg-red-50 px-4 py-2.5 rounded-xl">{usernameErr}</p>
            )}
            {usernameMsg && (
              <p className="text-emerald-600 text-sm bg-emerald-50 px-4 py-2.5 rounded-xl">{usernameMsg}</p>
            )}

            <button
              type="submit"
              disabled={usernameLoading}
              className="w-full py-3.5 rounded-xl font-bold text-gray-900 text-sm disabled:opacity-60 hover:opacity-90 transition-all"
              style={{ background: "linear-gradient(135deg, #D4A017 0%, #F5C518 100%)" }}
            >
              {usernameLoading ? "저장 중..." : "아이디 변경"}
            </button>
          </form>
        </div>

        {/* 비밀번호 변경 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h2 className="text-base font-bold text-gray-800 mb-1">비밀번호 변경</h2>
          <p className="text-xs text-gray-400 mb-6">
            현재 비밀번호를 확인한 후 새 비밀번호로 변경합니다.
          </p>

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">현재 비밀번호</label>
              <PasswordInput
                value={pwForm.current}
                onChange={(v) => setPwForm((p) => ({ ...p, current: v }))}
                show={showCurrent}
                onToggle={() => setShowCurrent((v) => !v)}
                placeholder="현재 비밀번호"
              />
            </div>

            <div className="h-px bg-gray-100" />

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">새 비밀번호</label>
              <PasswordInput
                value={pwForm.next}
                onChange={(v) => setPwForm((p) => ({ ...p, next: v }))}
                show={showNext}
                onToggle={() => setShowNext((v) => !v)}
                placeholder="새 비밀번호 (6자 이상)"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">새 비밀번호 확인</label>
              <PasswordInput
                value={pwForm.confirm}
                onChange={(v) => setPwForm((p) => ({ ...p, confirm: v }))}
                show={showConfirm}
                onToggle={() => setShowConfirm((v) => !v)}
                placeholder="새 비밀번호 재입력"
              />
              {pwForm.confirm && pwForm.next && (
                <p
                  className={`text-xs mt-1.5 ${
                    pwForm.next === pwForm.confirm ? "text-emerald-500" : "text-red-400"
                  }`}
                >
                  {pwForm.next === pwForm.confirm
                    ? "비밀번호가 일치합니다."
                    : "비밀번호가 일치하지 않습니다."}
                </p>
              )}
            </div>

            {pwErr && (
              <p className="text-red-500 text-sm bg-red-50 px-4 py-2.5 rounded-xl">{pwErr}</p>
            )}
            {pwMsg && (
              <p className="text-emerald-600 text-sm bg-emerald-50 px-4 py-2.5 rounded-xl">{pwMsg}</p>
            )}

            <button
              type="submit"
              disabled={pwLoading}
              className="w-full py-3.5 rounded-xl font-bold text-gray-900 text-sm disabled:opacity-60 hover:opacity-90 transition-all"
              style={{ background: "linear-gradient(135deg, #D4A017 0%, #F5C518 100%)" }}
            >
              {pwLoading ? "변경 중..." : "비밀번호 변경"}
            </button>
          </form>
        </div>
      </main>
    </PageLayout>
  );
}
