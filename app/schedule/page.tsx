"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import PageLayout from "@/components/PageLayout";
import { isLeadership } from "@/lib/roles";
import { Megaphone, CalendarDays, Plus, X } from "lucide-react";

function AnnouncementCard({ post }: { post: any }) {
  const author = post.authorId;
  return (
    <article
      className="bg-white rounded-xl p-4 space-y-2"
      style={{ border: "2px solid #FFD700", boxShadow: "0 2px 8px rgba(255,215,0,0.1)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-yellow-500 shrink-0"><Megaphone size={14} /></span>
          <h3 className="font-bold text-gray-900 text-sm truncate">{post.title}</h3>
        </div>
        <span className="text-[10px] text-gray-400 shrink-0">
          {new Date(post.createdAt).toLocaleDateString("ko-KR")}
        </span>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap pl-5">
        {post.content}
      </p>
      <p className="text-xs text-gray-400 pl-5">
        {author?.name} ({author?.role})
      </p>
    </article>
  );
}

export default function SchedulePage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const canPost = isLeadership(role);

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postStatusMessage, setPostStatusMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/announcements")
      .then((r) => r.json())
      .then((d) => setAnnouncements(Array.isArray(d) ? d : []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, postStatusMessage }),
    });
    setSubmitting(false);
    if (res.ok) {
      const newPost = await res.json();
      setAnnouncements((prev) => [newPost, ...prev]);
      setTitle(""); setContent(""); setPostStatusMessage(""); setShowForm(false);
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "오류가 발생했습니다.");
    }
  }

  return (
    <PageLayout>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">일정 및 공지사항</h1>
            <p className="text-sm text-gray-400 mt-1">동아리 일정과 공지를 확인하세요</p>
          </div>
          {canPost && (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-900 hover:opacity-90 transition-all"
              style={{ background: "linear-gradient(135deg, #D4A017 0%, #F5C518 100%)" }}
            >
              <Plus size={14} /> 공지 작성
            </button>
          )}
        </div>

        {/* 공지 작성 폼 */}
        {showForm && (
          <div className="mb-6 bg-white rounded-2xl border border-yellow-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Megaphone size={15} className="text-yellow-500" /> 새 공지사항
              </p>
              <button onClick={() => setShowForm(false)}><X size={16} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="공지 제목 *"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-yellow-400"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="공지 내용 *"
                required
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-yellow-400 resize-none leading-relaxed"
              />
              <div className="relative">
                <input
                  value={postStatusMessage}
                  onChange={(e) => setPostStatusMessage(e.target.value.slice(0, 15))}
                  placeholder="상태 메세지 (스토리에 표시됩니다) *"
                  required
                  maxLength={15}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-yellow-400"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                  {postStatusMessage.length}/15
                </span>
              </div>
              {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50">
                  취소
                </button>
                <button type="submit" disabled={submitting}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-900 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #D4A017 0%, #F5C518 100%)" }}>
                  {submitting ? "등록 중..." : "공지 등록"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 2컬럼 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── 왼쪽: 일정 (구글 캘린더 예정) ── */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays size={16} className="text-yellow-500" />
              <h2 className="text-base font-bold text-gray-900">일정</h2>
            </div>
            <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white" style={{ minHeight: "600px" }}>
              <iframe
                src="https://calendar.google.com/calendar/embed?src=ff9a25abf99088f96086438a3a2c7e8b09fecc143458b8cd96c9f85de6c1bf82%40group.calendar.google.com&ctz=Asia%2FSeoul"
                style={{ border: 0 }}
                width="100%"
                height="600"
                frameBorder={0}
                scrolling="no"
              />
            </div>
          </section>

          {/* ── 오른쪽: 공지사항 ── */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Megaphone size={16} className="text-yellow-500" />
              <h2 className="text-base font-bold text-gray-900">공지사항</h2>
              {announcements.length > 0 && (
                <span className="text-xs text-gray-400">({announcements.length})</span>
              )}
            </div>

            {announcements.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white py-16 flex flex-col items-center gap-2">
                <Megaphone size={32} className="text-gray-200" />
                <p className="text-gray-400 text-sm">아직 공지사항이 없습니다.</p>
                {canPost && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-2 text-xs text-yellow-600 hover:text-yellow-700 font-medium"
                  >
                    첫 공지 작성하기 →
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {announcements.map((post) => (
                  <AnnouncementCard key={post._id} post={post} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </PageLayout>
  );
}
