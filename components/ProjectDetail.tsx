"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ImagePlus, Paperclip, X } from "lucide-react";

const APPROVAL_COLOR: Record<string, string> = {
  진행중: "bg-blue-100 text-blue-800",
  검토대기: "bg-amber-100 text-amber-800",
  승인: "bg-green-100 text-green-800",
  거절: "bg-red-100 text-red-800",
};

// 유형별 메타데이터 필드 정의
const META_FIELDS: Record<string, { key: string; label: string }[]> = {
  논문: [
    { key: "dataset", label: "사용 데이터" },
    { key: "keyPapers", label: "핵심 논문" },
    { key: "mlTechniques", label: "머신러닝 & 딥러닝" },
    { key: "researchGoal", label: "연구 목표" },
  ],
  개발: [
    { key: "techStack", label: "기술 스택" },
    { key: "keyFeatures", label: "주요 기능" },
    { key: "deployment", label: "배포 환경" },
    { key: "githubUrl", label: "GitHub 링크" },
  ],
  공모전: [
    { key: "organizer", label: "주최 기관" },
    { key: "deadline", label: "제출 마감일" },
    { key: "team", label: "팀 구성" },
    { key: "awards", label: "수상 내역" },
  ],
};

function Avatar({ name, image }: { name: string; image?: string }) {
  if (image) return <img src={image} alt={name} className="w-8 h-8 rounded-full object-cover" />;
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-900 font-bold text-sm shrink-0"
      style={{ background: "linear-gradient(135deg, #D4A017 0%, #F5C518 100%)" }}
    >
      {name[0]}
    </div>
  );
}

export default function ProjectDetail({ project, logs, comments, currentUser }: {
  project: any;
  logs: any[];
  comments: any[];
  currentUser: { id: string; role: string } | null;
}) {
  const router = useRouter();
  const isOwner = !!(currentUser?.id && project.leadId?._id && String(project.leadId._id) === String(currentUser.id));
  const isLeadership = ["회장", "부회장"].includes(currentUser?.role ?? "");

  // ── 진행률
  const [progress, setProgress] = useState<number>(project.progressPercentage ?? 0);
  const [progressSaving, setProgressSaving] = useState(false);

  // ── 메타데이터 편집
  const [metaEdit, setMetaEdit] = useState(false);
  const [meta, setMeta] = useState<Record<string, string>>(project.metadata ?? {});
  const [metaSaving, setMetaSaving] = useState(false);

  // ── 업데이트 로그
  const [logTitle, setLogTitle] = useState("");
  const [logContent, setLogContent] = useState("");
  const [logImage, setLogImage] = useState<string | null>(null);
  const [logAttachments, setLogAttachments] = useState<{ name: string; url: string; type: string }[]>([]);
  const [logLoading, setLogLoading] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── 댓글
  const [commentContent, setCommentContent] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  const [localLogs, setLocalLogs] = useState(logs);
  const [localComments, setLocalComments] = useState(comments);

  // ── 파일 업로드
  async function uploadToCloudinary(file: File): Promise<{ url: string; name: string; type: string }> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) throw new Error("업로드 실패");
    const data = await res.json();
    return { url: data.url, name: file.name, type: file.type };
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const result = await uploadToCloudinary(file);
      setLogImage(result.url);
    } catch { /* 업로드 실패 무시 */ }
    setImageUploading(false);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setFileUploading(true);
    try {
      const uploaded = await Promise.all(files.map(uploadToCloudinary));
      setLogAttachments((prev) => [...prev, ...uploaded]);
    } catch { /* 실패 무시 */ }
    setFileUploading(false);
  }

  // ── 로그 추가
  async function handleAddLog(e: React.FormEvent) {
    e.preventDefault();
    if (!logTitle || !logContent) return;
    setLogLoading(true);
    setLogError(null);
    const res = await fetch(`/api/projects/${project._id}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: logTitle,
        content: logContent,
        imageUrl: logImage ?? undefined,
        attachments: logAttachments,
      }),
    });
    setLogLoading(false);
    if (res.ok) {
      const newLog = await res.json();
      setLocalLogs([newLog, ...localLogs]);
      setLogTitle("");
      setLogContent("");
      setLogImage(null);
      setLogAttachments([]);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setLogError(data.error ?? `오류가 발생했습니다 (${res.status})`);
    }
  }

  // ── 댓글 추가
  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentContent || localLogs.length === 0) return;
    setCommentLoading(true);
    const res = await fetch(`/api/projects/${project._id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentContent, postId: localLogs[0]._id }),
    });
    setCommentLoading(false);
    if (res.ok) {
      const newComment = await res.json();
      setLocalComments([...localComments, newComment]);
      setCommentContent("");
    }
  }

  async function handleDeleteComment(commentId: string) {
    await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
    setLocalComments(localComments.filter((c) => c._id !== commentId));
  }

  async function handleDeleteProject() {
    if (!confirm("프로젝트를 삭제하시겠습니까?")) return;
    await fetch(`/api/projects/${project._id}`, { method: "DELETE" });
    router.push("/projects");
  }

  async function handleApprovalChange(approvalStatus: string) {
    await fetch(`/api/projects/${project._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvalStatus }),
    });
    router.refresh();
  }

  async function handleProgressSave() {
    setProgressSaving(true);
    await fetch(`/api/projects/${project._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progressPercentage: progress }),
    });
    setProgressSaving(false);
    router.refresh();
  }

  async function handleMetaSave() {
    setMetaSaving(true);
    await fetch(`/api/projects/${project._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metadata: meta }),
    });
    setMetaSaving(false);
    setMetaEdit(false);
  }

  const metaFields = META_FIELDS[project.type] ?? [];
  const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-100";

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 space-y-8">

      {/* ── 헤더 ── */}
      <section className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
            {project.type && <Badge variant="outline" className="mt-1">{project.type}</Badge>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isLeadership ? (
              <select
                defaultValue={project.approvalStatus}
                onChange={(e) => handleApprovalChange(e.target.value)}
                className="text-sm border rounded-md px-2 py-1"
              >
                <option value="진행중">진행중</option>
                <option value="검토대기">검토대기</option>
                <option value="승인">승인</option>
                <option value="거절">거절</option>
              </select>
            ) : (
              <span className={`text-xs px-2 py-1 rounded-full ${APPROVAL_COLOR[project.approvalStatus]}`}>
                {project.approvalStatus}
              </span>
            )}
            {(isOwner || isLeadership) && (
              <>
                <Link href={`/projects/${project._id}/edit`}>
                  <Button variant="outline" size="sm">수정</Button>
                </Link>
                <Button variant="destructive" size="sm" onClick={handleDeleteProject}>삭제</Button>
              </>
            )}
          </div>
        </div>

        <div className="text-sm text-gray-400">
          리더:{" "}
          <Link href={`/profile/${project.leadId?.portfolioSlug}`} className="hover:underline text-gray-600">
            {project.leadId?.name}
          </Link>
          {project.startDate && (
            <span className="ml-4">시작일: {new Date(project.startDate).toLocaleDateString("ko-KR")}</span>
          )}
        </div>

        {/* 진행률 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>진행률</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          {isOwner ? (
            <div className="flex items-center gap-3">
              <input
                type="range" min={0} max={100} value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="flex-1 accent-yellow-400"
              />
              <Button size="sm" variant="outline" onClick={handleProgressSave} disabled={progressSaving}>
                {progressSaving ? "저장 중" : "저장"}
              </Button>
            </div>
          ) : (
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full"
                style={{ width: `${progress}%`, background: "linear-gradient(90deg, #D4A017, #F5C518)" }}
              />
            </div>
          )}
        </div>
      </section>

      {/* ── 프로젝트 개요 ── */}
      <section className="bg-gray-50 rounded-xl p-5 space-y-2">
        <h2 className="text-base font-semibold text-gray-900">프로젝트 개요</h2>
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
          {project.description || "설명이 없습니다."}
        </p>
      </section>

      {/* ── 유형별 상세 정보 ── */}
      {metaFields.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              {project.type} 정보
            </h2>
            {isOwner && (
              <button
                onClick={() => setMetaEdit((v) => !v)}
                className="text-xs text-yellow-600 hover:text-yellow-700 font-medium"
              >
                {metaEdit ? "취소" : "편집"}
              </button>
            )}
          </div>

          {metaEdit ? (
            <div className="space-y-3 bg-gray-50 rounded-xl p-4">
              {metaFields.map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">{label}</label>
                  <textarea
                    value={meta[key] ?? ""}
                    onChange={(e) => setMeta((prev) => ({ ...prev, [key]: e.target.value }))}
                    rows={2}
                    placeholder={`${label} 입력...`}
                    className={`${inputCls} resize-none`}
                  />
                </div>
              ))}
              <Button size="sm" onClick={handleMetaSave} disabled={metaSaving}>
                {metaSaving ? "저장 중..." : "저장"}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {metaFields.map(({ key, label }) => (
                <div
                  key={key}
                  className="rounded-xl border border-gray-100 bg-white px-4 py-3 flex gap-3"
                >
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-lg shrink-0 self-start"
                    style={{ background: "rgba(255,215,0,0.15)", color: "#9a6f00", border: "1px solid #FFD700" }}
                  >
                    {label}
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {meta[key] || <span className="text-gray-300 italic">미입력</span>}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── 업데이트 로그 ── */}
      <section>
        <h2 className="text-lg font-semibold mb-4">업데이트 로그</h2>

        {(isOwner || isLeadership) && (
          <form onSubmit={handleAddLog} className="mb-6 space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <Input
              value={logTitle}
              onChange={(e) => setLogTitle(e.target.value)}
              placeholder="업데이트 제목"
              required
            />
            <Textarea
              value={logContent}
              onChange={(e) => setLogContent(e.target.value)}
              placeholder="진행 내용을 작성하세요..."
              rows={3}
              required
            />

            {/* 이미지 미리보기 */}
            {logImage && (
              <div className="relative inline-block">
                <img src={logImage} alt="첨부 이미지" className="h-28 rounded-lg object-cover border border-gray-200" />
                <button
                  type="button"
                  onClick={() => setLogImage(null)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* 파일 목록 */}
            {logAttachments.length > 0 && (
              <div className="space-y-1">
                {logAttachments.map((att, i) => (
                  <div key={att.url} className="flex items-center gap-2 text-xs text-gray-600">
                    <Paperclip size={12} />
                    <span className="truncate flex-1">{att.name}</span>
                    <button
                      type="button"
                      onClick={() => setLogAttachments((prev) => prev.filter((_, j) => j !== i))}
                      className="text-red-400"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 에러 표시 */}
            {logError && (
              <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{logError}</p>
            )}

            {/* 업로드 버튼 */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => imageRef.current?.click()}
                disabled={imageUploading}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-yellow-600 transition-colors"
              >
                <ImagePlus size={15} />
                {imageUploading ? "업로드 중..." : "사진 추가"}
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={fileUploading}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-yellow-600 transition-colors"
              >
                <Paperclip size={15} />
                {fileUploading ? "업로드 중..." : "파일 첨부"}
              </button>
              <input ref={imageRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              <input ref={fileRef} type="file" multiple onChange={handleFileSelect} className="hidden" />
              <div className="ml-auto">
                <Button type="submit" size="sm" disabled={logLoading}>
                  {logLoading ? "추가 중..." : "업데이트 추가"}
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* 로그 타임라인 */}
        <div className="relative pl-4 border-l-2 border-gray-200 space-y-4">
          {localLogs.length === 0 && <p className="text-sm text-gray-400">업데이트 로그가 없습니다.</p>}
          {localLogs.map((log) => (
            <div key={log._id} className="relative">
              <div className="absolute -left-[21px] top-3 w-3 h-3 rounded-full bg-yellow-400 border-2 border-white" />
              <div
                className="bg-white rounded-xl p-4 space-y-2"
                style={{ border: "2px solid #FFD700", boxShadow: "0 2px 8px rgba(255,215,0,0.1)" }}
              >
                <div className="flex items-center gap-2">
                  {log.authorId && <Avatar name={log.authorId.name} image={log.authorId.avatar} />}
                  <div>
                    <p className="text-sm font-bold text-yellow-600">{log.title}</p>
                    <p className="text-[11px] text-gray-400">{new Date(log.createdAt).toLocaleString("ko-KR")}</p>
                  </div>
                </div>
                {log.imageUrl && (
                  <img src={log.imageUrl} alt="" className="w-full max-h-64 object-cover rounded-lg border border-gray-100" />
                )}
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{log.content}</p>
                {log.attachments?.length > 0 && (
                  <div className="space-y-1">
                    {log.attachments.map((att: any) => (
                      <a key={att.url} href={att.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                        <Paperclip size={11} /> {att.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 댓글 ── */}
      <section>
        <h2 className="text-lg font-semibold mb-4">
          댓글{localComments.length > 0 && ` (${localComments.length})`}
        </h2>
        <div className="space-y-3 mb-4">
          {localComments.length === 0 && <p className="text-sm text-gray-400">첫 댓글을 남겨보세요.</p>}
          {localComments.map((c) => (
            <div key={c._id} className="bg-white border rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {c.userId && <Avatar name={c.userId.name} image={c.userId.avatar} />}
                  <Link href={`/profile/${c.userId?.portfolioSlug}`} className="text-sm font-medium hover:underline">
                    {c.userId?.name}
                  </Link>
                </div>
                {(currentUser?.id === c.userId?._id || isLeadership) && (
                  <button onClick={() => handleDeleteComment(c._id)} className="text-xs text-red-400 hover:text-red-600">
                    삭제
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap pl-10">{c.content}</p>
              <p className="text-xs text-gray-400 pl-10">{new Date(c.createdAt).toLocaleString("ko-KR")}</p>
            </div>
          ))}
        </div>

        {currentUser && (
          localLogs.length > 0 ? (
            <form onSubmit={handleAddComment} className="space-y-2 bg-gray-50 p-4 rounded-xl">
              <Textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="댓글을 작성하세요..."
                rows={2}
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={commentLoading}>
                  {commentLoading ? "등록 중..." : "댓글 등록"}
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-gray-400 bg-gray-50 px-4 py-3 rounded-xl">
              업데이트 로그를 먼저 추가하면 댓글을 달 수 있습니다.
            </p>
          )
        )}
      </section>
    </main>
  );
}
