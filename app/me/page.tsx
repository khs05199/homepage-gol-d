"use client";

import { useState, useEffect, useRef } from "react";
import PageLayout from "@/components/PageLayout";

export default function MyProfilePage() {
  const [form, setForm] = useState({ name: "", statusMessage: "", bio: "", skills: "" });
  const [avatar, setAvatar] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [portfolioSlug, setPortfolioSlug] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((u) => {
        setForm({ name: u.name ?? "", statusMessage: u.statusMessage ?? "", bio: u.bio ?? "", skills: (u.skills ?? []).join(", ") });
        setAvatar(u.avatar ?? "");
        setUsername(u.username ?? "");
        setPortfolioSlug(u.portfolioSlug ?? "");
      });
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (data.url) {
      setAvatar(data.url);
      await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: data.url }),
      });
    }
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        statusMessage: form.statusMessage,
        bio: form.bio,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const circleText = (username || form.name)?.[0]?.toUpperCase() ?? "?";
  const idInitial = username ? username.split(".")[0].toUpperCase() : circleText;

  const inputClass =
    "w-full px-4 py-3.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-300 text-sm focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition-all";

  return (
    <PageLayout>
      <main className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">내 프로필</h1>

        {/* 아바타 섹션 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-4 flex flex-col items-center gap-4">
          <p className="text-sm font-semibold text-gray-700 self-start">스토리 프로필 이미지</p>
          <div className="relative">
            {/* 스토리 원형 미리보기 */}
            <div
              className="w-24 h-24 rounded-full border-[4px] overflow-hidden flex items-center justify-center"
              style={{
                borderColor: "#FFD700",
                background: "radial-gradient(circle at 30% 30%, #FFD700, #D4A700)",
              }}
            >
              {avatar ? (
                <img src={avatar} alt="프로필" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-900 font-black text-xl leading-none">{idInitial}</span>
              )}
            </div>
            {/* 변경 버튼 오버레이 */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity disabled:opacity-50"
              style={{ background: "rgba(0,0,0,0.45)" }}
            >
              <span className="text-white text-xs font-bold">
                {uploading ? "업로드 중" : "변경"}
              </span>
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <p className="text-xs text-gray-400 text-center">
            원형 위에 마우스를 올리면 변경 버튼이 나타납니다<br />
            스토리에서{" "}
            <span className="font-semibold text-gray-600">
              {username ? username : "아이디"}
            </span>
            로 표시됩니다
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          {username && (
            <div className="mb-6 pb-6 border-b border-gray-100">
              <p className="text-xs text-gray-400 mb-1 font-medium">아이디 (변경 불가)</p>
              <p className="text-sm font-bold text-gray-700">{username}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">이름</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">상태 메시지</label>
              <input
                name="statusMessage"
                value={form.statusMessage}
                onChange={handleChange}
                placeholder="오늘의 한 마디"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">자기소개</label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={4}
                placeholder="간단한 자기소개를 작성하세요"
                className={`${inputClass} resize-none leading-relaxed`}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">기술 스택</label>
              <input
                name="skills"
                value={form.skills}
                onChange={handleChange}
                placeholder="React, TypeScript, Python (쉼표로 구분)"
                className={inputClass}
              />
            </div>

            {portfolioSlug && (
              <p className="text-xs text-gray-400">
                포트폴리오:{" "}
                <a href={`/profile/${portfolioSlug}`} className="text-yellow-600 hover:underline">
                  /profile/{portfolioSlug}
                </a>
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-gray-900 text-sm disabled:opacity-60 transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #D4A017 0%, #F5C518 100%)" }}
            >
              {saved ? "저장 완료!" : loading ? "저장 중..." : "저장"}
            </button>
          </form>
        </div>
      </main>
    </PageLayout>
  );
}
