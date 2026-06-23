"use client";

import { useState } from "react";
import Link from "next/link";

// ── 멤버 스토리 원형 ──────────────────────────────────────────
function StoryCircle({ member }: { member: any }) {
  const displayId = member.username ?? member.portfolioSlug ?? member.name ?? "?";
  const circleText = displayId.split(".")[0].toUpperCase(); // "HS" from "hs.kwon"

  return (
    <Link href={`/profile/${member.portfolioSlug ?? member.username}`} className="group flex flex-col items-center gap-1 shrink-0">
      <div className="relative">
        {/* 말풍선 — hover 시 표시 */}
        {member.statusMessage && (
          <div
            className="absolute -top-8 left-1/2 -translate-x-1/2 text-white text-[9px] font-semibold px-2 py-1 rounded-md whitespace-nowrap max-w-[90px] truncate z-10
                       opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ background: "#1A5A96" }}
          >
            {member.statusMessage}
            <span
              className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 block w-0 h-0"
              style={{
                borderLeft: "4px solid transparent",
                borderRight: "4px solid transparent",
                borderTop: "5px solid #1A5A96",
              }}
            />
          </div>
        )}

        {/* 아바타 */}
        <div
          className="w-12 h-12 rounded-full border-[3px] border-gray-900 overflow-hidden flex items-center justify-center cursor-pointer group-hover:scale-105 transition-transform"
          style={{ background: "radial-gradient(circle at 30% 30%, #FFD700, #D4A700)" }}
        >
          {member.avatar ? (
            <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-900 font-black text-[10px] leading-none tracking-tight">
              {circleText}
            </span>
          )}
        </div>
      </div>

      {/* 아이디 */}
      <span className="text-[9px] text-gray-700 font-medium max-w-[52px] truncate text-center leading-tight">
        {displayId}
      </span>
    </Link>
  );
}

// ── 반응 버튼 ──────────────────────────────────────────
function ReactionButton({
  type,
  count,
  onClick,
}: {
  type: "check" | "thumbsup" | "heart";
  count: number;
  onClick: (e: React.MouseEvent) => void;
}) {
  const emoji = type === "check" ? "✓" : type === "thumbsup" ? "👍" : "❤️";
  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-1 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-all hover:opacity-80 active:scale-95"
      style={{ background: "#1A1A1A" }}
    >
      {emoji}
      {count > 0 && (
        <span
          className="absolute -top-2 -right-2 text-white text-[9px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center"
          style={{ background: "#0066CC" }}
        >
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

  async function handleReaction(e: React.MouseEvent, type: "check" | "thumbsup" | "heart") {
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

  const author = post.authorId;
  const proj = post.projectId;
  const hasImage = !!post.imageUrl;

  // 클릭 시 이동 대상: 프로젝트 업데이트면 해당 프로젝트, 공지면 null
  const targetUrl = proj?._id ? `/projects/${proj._id}` : null;

  const cardContent = (
    <>
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="font-bold text-yellow-600 text-sm">{author?.name}</span>
          <span className="text-gray-500 text-xs ml-1">({author?.role})</span>
          <p className="text-xs text-gray-400 mt-0.5">{post.category}</p>
        </div>
        {author?.statusMessage && (
          <span
            className="text-xs px-3 py-1.5 rounded-lg text-gray-700 shrink-0 ml-3"
            style={{ background: "rgba(0,0,0,0.06)", border: "1.5px solid #ccc" }}
          >
            {author.statusMessage}
          </span>
        )}
      </div>

      {/* 프로젝트 태그 */}
      {proj && (
        <div className="mb-3">
          <span
            className="inline-block text-xs font-bold px-4 py-2 rounded-lg"
            style={{ background: "#fff", border: "2px solid #FF9999" }}
          >
            PROJECT: {proj.title}
          </span>
        </div>
      )}

      {/* 제목 */}
      <h3 className="font-bold text-gray-900 text-sm mb-2">{post.title}</h3>

      {/* 본문 */}
      <div className={`${hasImage ? "grid grid-cols-2 gap-4" : ""} mb-3`}>
        {hasImage && (
          <img
            src={post.imageUrl}
            alt=""
            className="rounded-lg w-full h-32 object-cover border border-gray-200"
          />
        )}
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">{post.content}</p>
      </div>

      {/* 파일 첨부 */}
      {post.attachments?.length > 0 && (
        <div className="mb-3 space-y-1">
          {post.attachments.map((att: any) => (
            <span key={att.url} className="text-xs text-blue-500 flex items-center gap-1">
              📎 {att.name}
            </span>
          ))}
        </div>
      )}

      {/* 메타데이터 */}
      <div className="flex gap-4 text-xs text-gray-400 mb-3">
        <span>조회 {post.viewCount ?? 0}</span>
        <span>댓글 {post.commentCount ?? 0}</span>
        <span className="ml-auto">{new Date(post.createdAt).toLocaleDateString("ko-KR")}</span>
      </div>
    </>
  );

  return (
    <div className="relative">
      <article
        className="bg-white rounded-xl overflow-hidden"
        style={{ border: "2px solid #FFD700", boxShadow: "0 4px 16px rgba(255,215,0,0.15)" }}
      >
        {/* 클릭 가능 영역 */}
        {targetUrl ? (
          <Link href={targetUrl} className="block px-6 pt-6 pb-2 hover:bg-yellow-50/30 transition-colors">
            {cardContent}
          </Link>
        ) : (
          <div className="px-6 pt-6 pb-2">{cardContent}</div>
        )}

        {/* 반응 버튼 (링크 밖) */}
        <div className="flex gap-2 px-6 pb-5">
          <ReactionButton type="check" count={reactions.check} onClick={(e) => handleReaction(e, "check")} />
          <ReactionButton type="thumbsup" count={reactions.thumbsup} onClick={(e) => handleReaction(e, "thumbsup")} />
          <ReactionButton type="heart" count={reactions.heart} onClick={(e) => handleReaction(e, "heart")} />
          {targetUrl && (
            <Link
              href={targetUrl}
              className="ml-auto text-xs text-gray-400 hover:text-yellow-600 transition-colors self-center"
            >
              댓글 달기 →
            </Link>
          )}
        </div>
      </article>

      {/* 카드 하단 화살표 (공지 아닌 경우만) */}
      {proj && (
        <div
          className="absolute left-10 -bottom-[11px] w-5 h-5 bg-white rotate-45 pointer-events-none"
          style={{ border: "2px solid #FFD700", borderTop: "none", borderLeft: "none" }}
        />
      )}
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
  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">

      {/* ── 헤더 바 (멤버 스토리 포함) ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(90deg, #FFD700 0%, #FFC300 100%)",
          boxShadow: "0 4px 12px rgba(255,215,0,0.25)",
        }}
      >
        <div className="flex items-center gap-4 px-5 py-4">
          {/* 좌측 타이틀 */}
          <h2 className="text-base font-bold text-gray-900 shrink-0">최근 업데이트</h2>

          {/* 멤버 스토리 영역 */}
          <div className="flex-1 overflow-x-auto flex items-center gap-4 scrollbar-hide">
            {members.length === 0 && (
              <p className="text-xs text-gray-700 py-2">부원이 없습니다</p>
            )}
            {members.map((m) => (
              <StoryCircle key={m._id} member={m} />
            ))}
          </div>

          {/* 우측 새 프로젝트 버튼 */}
          <Link
            href="/projects/new"
            className="shrink-0 text-yellow-400 text-xs font-bold px-4 py-2 rounded-lg transition-all hover:opacity-80"
            style={{ background: "#1A1A1A" }}
          >
            + 새 프로젝트
          </Link>
        </div>
      </div>

      {/* ── 포스트 피드 ── */}
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
    </main>
  );
}
