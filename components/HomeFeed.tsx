"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, CheckCircle2 } from "lucide-react";
import { NAVY, GOLD_GRADIENT } from "@/lib/theme";
import UpdateLogCard from "@/components/UpdateLogCard";

const STORY_ROW_LIMIT = 8;

// ── 스토리 이동 링크 계산 ──────────────────────────────────────────
function getStoryHref(member: any): string {
  if (member.recentPostCategory === "프로젝트" && member.recentPostProjectId) {
    return `/projects/${member.recentPostProjectId}`;
  }
  if (member.recentPostCategory === "공지") {
    return "/schedule";
  }
  if (member.recentPostCategory === "회의") {
    return "/meetings";
  }
  return `/profile/${member.portfolioSlug ?? member.username}`;
}

// ── 멤버 스토리 원형 아바타 ──────────────────────────────────────────
function StoryCard({ member }: { member: any }) {
  const displayId = member.username ?? member.portfolioSlug ?? member.name ?? "?";
  const initials = displayId.split(".")[0].toUpperCase().slice(0, 2);
  const bubbleText = member.postStatusMessage ?? member.statusMessage;
  const href = getStoryHref(member);

  return (
    <Link href={href} className="group relative flex flex-col items-center gap-1 shrink-0">
      {/* 아바타 — 원형 (인스타그램 스토리 스타일) */}
      <div
        className="w-14 h-14 rounded-full border-2 overflow-hidden flex items-center justify-center cursor-pointer group-hover:scale-105 transition-transform"
        style={{ background: "radial-gradient(circle at 30% 30%, #FFD700, #D4A700)", borderColor: "#16233F" }}
      >
        {member.avatar ? (
          <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-900 font-black text-[10px] leading-none tracking-tight">
            {initials}
          </span>
        )}
      </div>

      {/* 아이디 */}
      <span className="text-[9px] font-medium max-w-[48px] truncate text-center leading-tight" style={{ color: "#16233F" }}>
        {displayId}
      </span>

      {/* 말풍선 — 아이디 아래에 표시 */}
      {bubbleText && (
        <div
          className="absolute top-full mt-1 left-1/2 -translate-x-1/2
                     text-[9px] font-semibold px-2 py-1 rounded-md
                     whitespace-nowrap max-w-[100px] truncate z-20
                     opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ background: "#FBF5E6", color: "#16233F" }}
        >
          {/* 위쪽 꼭지 */}
          <span
            className="absolute -top-[5px] left-1/2 -translate-x-1/2 block w-0 h-0"
            style={{
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderBottom: "5px solid #FBF5E6",
            }}
          />
          {bubbleText}
        </div>
      )}
    </Link>
  );
}

// ── 반응 아이콘 버튼 (라인 스타일) ──────────────────────────────────────────
function IconActionButton({
  icon: Icon,
  count,
  onClick,
  active,
}: {
  icon: typeof Heart;
  count?: number;
  onClick: (e: React.MouseEvent) => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-1 transition-transform hover:scale-110 active:scale-95"
      style={{ color: NAVY }}
    >
      <Icon size={22} strokeWidth={1.75} fill={active ? NAVY : "none"} />
      {!!count && (
        <span className="text-xs font-semibold" style={{ color: NAVY }}>
          {count}
        </span>
      )}
    </button>
  );
}

// ── 포스트 카드 ──────────────────────────────────────────
function PostCard({ post }: { post: any }) {
  const [reactions, setReactions] = useState<{ check: number; thumbsup: number; heart: number }>(
    post.reactions ?? { check: 0, thumbsup: 0, heart: 0 }
  );

  async function handleReaction(e: React.MouseEvent, type: "check" | "heart") {
    e.preventDefault();
    e.stopPropagation();
    const res = await fetch(`/api/posts/${post._id}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reactionType: type }),
    });
    if (res.ok) {
      const data = await res.json();
      setReactions(data.reactions);
    }
  }

  // ── 댓글 패널 ──
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[] | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionUsers, setMentionUsers] = useState<any[] | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function toggleComments(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !showComments;
    setShowComments(next);
    if (next && comments === null) {
      const res = await fetch(`/api/posts/${post._id}/comments`);
      if (res.ok) setComments(await res.json());
    }
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

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentLoading(true);
    const res = await fetch(`/api/posts/${post._id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentText }),
    });
    setCommentLoading(false);
    if (res.ok) {
      const newComment = await res.json();
      setComments((prev) => [...(prev ?? []), newComment]);
      setCommentText("");
    }
  }

  const author = post.authorId;
  const proj = post.projectId;

  const meetingId = post.meetingId?._id ?? post.meetingId;
  // 논문 프로젝트 로그는 프로젝트 개요 없이 로그 상세 페이지로 바로 이동
  const targetUrl = proj?._id
    ? proj.type === "논문"
      ? `/projects/${proj._id}/logs/${post._id}`
      : `/projects/${proj._id}`
    : meetingId
    ? "/meetings"
    : null;

  const headTitle = proj?.title ?? post.category;

  const cardBody = <UpdateLogCard post={post} headTitle={headTitle} />;

  return (
    <div className="flex gap-4">
      <article
        className={`bg-white rounded-2xl overflow-hidden transition-all duration-300 ${
          showComments ? "w-3/4" : "w-full"
        }`}
        style={{ border: `2px solid ${NAVY}`, boxShadow: "0 4px 20px rgba(191,149,63,0.25)" }}
      >
        {targetUrl ? (
          <Link href={targetUrl} className="block hover:bg-[#16233F]/[0.02] transition-colors">
            {cardBody}
          </Link>
        ) : (
          cardBody
        )}

        {/* 하단: 작성자/시간 — 반응/댓글 아이콘 */}
        <div
          className="flex items-center justify-between gap-4 px-6 py-4"
          style={{ borderTop: "1.5px solid rgba(22,35,63,0.1)" }}
        >
          <div className="text-xs leading-relaxed shrink-0">
            <p className="font-semibold" style={{ color: NAVY }}>
              게시자 : {author?.name} ({author?.role})
            </p>
            <p className="text-gray-400">
              시간 : {new Date(post.createdAt).toLocaleDateString("ko-KR")}
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <IconActionButton icon={Heart} count={reactions.heart} onClick={(e) => handleReaction(e, "heart")} />
            <IconActionButton icon={MessageCircle} count={comments?.length ?? post.commentCount ?? 0} onClick={toggleComments} />
            <IconActionButton icon={CheckCircle2} count={reactions.check} onClick={(e) => handleReaction(e, "check")} />
          </div>
        </div>
      </article>

      {/* 댓글 패널 — 아이콘 클릭 시 오른쪽에서 슬라이드 인 */}
      <div
        className={`bg-white rounded-2xl transition-all duration-300 overflow-hidden ${
          showComments ? "w-1/4 opacity-100" : "w-0 opacity-0"
        }`}
        style={{ border: showComments ? `2px solid ${NAVY}` : "none" }}
      >
        {showComments && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[420px]">
              {(comments ?? []).length === 0 && (
                <p className="text-xs text-gray-400">첫 댓글을 남겨보세요.</p>
              )}
              {(comments ?? []).map((c) => {
                // 로그 상세 페이지가 있는 댓글은 클릭 시 해당 자료 위치로 이동
                const commentHref = targetUrl?.includes("/logs/")
                  ? `${targetUrl}#material-${c.materialId ?? "main"}`
                  : null;
                const body = (
                  <>
                    <span className="font-semibold" style={{ color: NAVY }}>
                      {c.userId?.name}
                    </span>
                    <p className="text-gray-700 whitespace-pre-wrap">{c.content}</p>
                  </>
                );
                return commentHref ? (
                  <Link
                    key={c._id}
                    href={commentHref}
                    className="block text-xs -mx-1 px-1 py-0.5 rounded-md hover:bg-[#16233F]/5 transition-colors"
                  >
                    {body}
                  </Link>
                ) : (
                  <div key={c._id} className="text-xs">
                    {body}
                  </div>
                );
              })}
            </div>

            <form
              onSubmit={handleSubmitComment}
              className="relative p-3"
              style={{ borderTop: "1.5px solid rgba(22,35,63,0.1)" }}
            >
              {mentionSuggestions.length > 0 && (
                <div
                  className="absolute bottom-full left-3 right-3 mb-1 bg-white rounded-lg shadow-lg max-h-40 overflow-y-auto z-30"
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
    </div>
  );
}

// ── 메인 피드 ──────────────────────────────────────────
export default function HomeFeed({
  posts,
  members,
}: {
  posts: any[];
  members: any[];
  session: any;
}) {
  const firstRow = members.slice(0, STORY_ROW_LIMIT);
  const overflowRow = members.slice(STORY_ROW_LIMIT);

  return (
    <div className="flex flex-col min-h-screen">

      {/* ── 헤더 바 (전체 너비, 실제 금박 질감의 골드 그라디언트) ── */}
      <div
        style={{
          background: GOLD_GRADIENT,
        }}
      >
        {/* 메인 행: 타이틀 + 첫 N개 스토리 + 새 프로젝트 버튼 */}
        <div className="flex items-center gap-4 px-6 py-4">
          <h2 className="text-base font-bold shrink-0" style={{ color: NAVY }}>최근 업데이트</h2>

          <div className="flex items-center gap-4 flex-1 min-w-0">
            {firstRow.length === 0 && (
              <p className="text-xs" style={{ color: NAVY }}>오늘 업데이트한 부원이 없습니다</p>
            )}
            {firstRow.map((m) => (
              <StoryCard key={m._id} member={m} />
            ))}
          </div>

          <Link
            href="/projects/new"
            className="shrink-0 text-yellow-400 text-xs font-bold px-4 py-2 rounded-lg transition-all hover:opacity-80"
            style={{ background: "#1A1A1A" }}
          >
            + 새 프로젝트
          </Link>
        </div>

        {/* 오버플로우 행: 연한 회색 바 */}
        {overflowRow.length > 0 && (
          <div className="flex items-center gap-4 px-6 py-2" style={{ background: "rgba(0,0,0,0.08)" }}>
            {overflowRow.map((m) => (
              <StoryCard key={m._id} member={m} />
            ))}
          </div>
        )}
      </div>

      {/* ── 포스트 피드 (꽉 찬 너비) ── */}
      <div className="w-full px-8 py-6 space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm">아직 업데이트가 없습니다.</p>
            <Link
              href="/projects/new"
              className="inline-block mt-4 text-xs px-5 py-2.5 rounded-full font-semibold text-gray-900"
              style={{ background: "linear-gradient(135deg, #D4A017 0%, #F5C518 100%)" }}
            >
              첫 프로젝트 만들기
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((p) => (
              <PostCard key={p._id} post={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
