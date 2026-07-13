"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { NAVY } from "@/lib/theme";

// ── 자료(이미지+텍스트) 한 줄 + 그 자료 전용 댓글 스레드 ──────────────────
function MaterialRow({
  post,
  materialKey,
  imageUrl,
  text,
  initialCount,
}: {
  post: any;
  materialKey: string;
  imageUrl?: string;
  text?: string;
  initialCount: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<any[] | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionUsers, setMentionUsers] = useState<any[] | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function loadComments() {
    const res = await fetch(`/api/posts/${post._id}/comments`);
    if (res.ok) {
      const all = await res.json();
      setComments(all.filter((c: any) => (c.materialId ?? "main") === materialKey));
    }
  }

  async function toggleExpanded() {
    const next = !expanded;
    setExpanded(next);
    if (next && comments === null) await loadComments();
  }

  async function ensureMentionUsersLoaded() {
    if (mentionUsers !== null) return;
    const res = await fetch("/api/users");
    if (res.ok) setMentionUsers(await res.json());
  }

  function handleCommentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setCommentText(val);
    const caret = e.target.selectionStart ?? val.length;
    const match = val.slice(0, caret).match(/@([^\s@]*)$/);
    if (match) {
      setMentionQuery(match[1]);
      ensureMentionUsersLoaded();
    } else {
      setMentionQuery(null);
    }
  }

  function selectMention(u: any) {
    const caret = textareaRef.current?.selectionStart ?? commentText.length;
    const before = commentText.slice(0, caret).replace(/@([^\s@]*)$/, `@${u.username ?? u.name} `);
    const after = commentText.slice(caret);
    setCommentText(before + after);
    setMentionQuery(null);
    textareaRef.current?.focus();
  }

  const mentionSuggestions =
    mentionQuery !== null && mentionUsers
      ? mentionUsers
          .filter((u) =>
            `${u.name ?? ""}${u.username ?? ""}`.toLowerCase().includes(mentionQuery.toLowerCase())
          )
          .slice(0, 6)
      : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentLoading(true);
    const res = await fetch(`/api/posts/${post._id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: commentText,
        materialId: materialKey === "main" ? null : materialKey,
      }),
    });
    setCommentLoading(false);
    if (res.ok) {
      const c = await res.json();
      setComments((prev) => [...(prev ?? []), c]);
      setCommentText("");
    }
  }

  const count = comments?.length ?? initialCount;

  return (
    <div
      id={`material-${materialKey}`}
      className="rounded-xl overflow-hidden scroll-mt-24"
      style={{ border: `2px solid ${NAVY}` }}
    >
      <div className="grid grid-cols-2 gap-4 p-4">
        <div className="rounded-xl overflow-hidden h-56" style={{ background: "rgba(22,35,63,0.06)" }}>
          {imageUrl ? (
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: "#8a7a52" }}>
              이미지 없음
            </div>
          )}
        </div>

        <div className="relative rounded-xl h-56 overflow-y-auto p-4" style={{ background: "rgba(22,35,63,0.03)" }}>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap pr-8">{text}</p>
          <button
            onClick={toggleExpanded}
            className="absolute bottom-3 right-3 flex items-center gap-1 transition-transform hover:scale-110"
            style={{ color: NAVY }}
          >
            <MessageCircle size={20} strokeWidth={1.75} fill={expanded ? NAVY : "none"} />
            {count > 0 && <span className="text-xs font-semibold">{count}</span>}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: "1.5px solid rgba(22,35,63,0.1)" }}>
          <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
            {(comments ?? []).length === 0 && (
              <p className="text-xs text-gray-400">첫 댓글을 남겨보세요.</p>
            )}
            {(comments ?? []).map((c) => (
              <div key={c._id} className="text-xs">
                <span className="font-semibold" style={{ color: NAVY }}>
                  {c.userId?.name}
                </span>
                <p className="text-gray-700 whitespace-pre-wrap">{c.content}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="relative p-4 pt-0">
            {mentionSuggestions.length > 0 && (
              <div
                className="absolute bottom-full left-4 right-4 mb-1 bg-white rounded-lg shadow-lg max-h-40 overflow-y-auto z-30"
                style={{ border: `1.5px solid ${NAVY}` }}
              >
                {mentionSuggestions.map((u) => (
                  <button
                    key={u._id}
                    type="button"
                    onClick={() => selectMention(u)}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100"
                  >
                    @{u.username ?? u.name} <span className="text-gray-400">({u.name})</span>
                  </button>
                ))}
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={commentText}
              onChange={handleCommentChange}
              placeholder="댓글을 입력하세요 (@ 로 멘션)"
              rows={2}
              className="w-full text-xs rounded-lg p-2 resize-none"
              style={{ border: "1.5px solid rgba(22,35,63,0.2)" }}
            />
            <button
              type="submit"
              disabled={commentLoading}
              className="mt-2 text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: NAVY, color: "#fff" }}
            >
              {commentLoading ? "등록 중..." : "등록"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function LogDetail({
  post,
  project,
  initialComments,
}: {
  post: any;
  project: any;
  initialComments: any[];
  currentUser: { id: string; role: string } | null;
}) {
  const materials =
    post.materials?.length > 0
      ? post.materials
      : [{ _id: null, imageUrl: post.imageUrl, text: post.content }];

  const countByMaterial: Record<string, number> = {};
  for (const c of initialComments) {
    const key = (c.materialId ?? "main").toString();
    countByMaterial[key] = (countByMaterial[key] ?? 0) + 1;
  }

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash.startsWith("material-")) {
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, []);

  const d = new Date(post.createdAt);
  const dateStr = `${d.getFullYear()} / ${String(d.getMonth() + 1).padStart(2, "0")} / ${String(d.getDate()).padStart(2, "0")}`;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <Link href={`/projects/${project._id}`} className="text-xs font-medium hover:underline" style={{ color: NAVY }}>
        ← {project.title}
      </Link>
      <h1 className="text-xl font-bold mt-2 mb-6" style={{ color: NAVY }}>
        Update LOG {dateStr}
      </h1>

      <section className="mb-6">
        <h2 className="text-sm font-bold mb-2" style={{ color: NAVY }}>
          핵심 변경사항
        </h2>
        <div
          className="rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap min-h-[60px]"
          style={{ border: `1.5px solid ${NAVY}` }}
        >
          {post.content}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-sm font-bold mb-2" style={{ color: NAVY }}>
          LLM 요약
        </h2>
        <div
          className="rounded-xl p-6 text-center text-sm text-gray-400"
          style={{ border: `1.5px solid ${NAVY}` }}
        >
          준비 중..
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold mb-3" style={{ color: NAVY }}>
          자료 및 설명
        </h2>
        <div className="space-y-4">
          {materials.map((m: any) => {
            const key = (m._id ?? "main").toString();
            return (
              <MaterialRow
                key={key}
                post={post}
                materialKey={key}
                imageUrl={m.imageUrl}
                text={m.text}
                initialCount={countByMaterial[key] ?? 0}
              />
            );
          })}
        </div>
      </section>
    </main>
  );
}
