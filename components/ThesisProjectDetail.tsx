"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ImagePlus, Paperclip, X } from "lucide-react";
import { NAVY, GOLD_GRADIENT } from "@/lib/theme";
import UpdateLogCard from "@/components/UpdateLogCard";

const APPROVAL_COLOR: Record<string, string> = {
  진행중: "bg-blue-100 text-blue-800",
  검토대기: "bg-amber-100 text-amber-800",
  승인: "bg-green-100 text-green-800",
  거절: "bg-red-100 text-red-800",
};

// 논문 프로젝트 전용 메타데이터 필드
const THESIS_META_FIELDS = [
  { key: "dataset", label: "사용 데이터" },
  { key: "keyPapers", label: "핵심 논문" },
  { key: "mlTechniques", label: "머신러닝 & 딥러닝" },
  { key: "researchGoal", label: "연구 목표" },
];

export default function ThesisProjectDetail({ project, logs, currentUser }: {
  project: any;
  logs: any[];
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

  // ── 업데이트 로그 작성 폼
  const [logTitle, setLogTitle] = useState("");
  const [logContent, setLogContent] = useState("");
  const [logStatusMsg, setLogStatusMsg] = useState("");
  const [logImage, setLogImage] = useState<string | null>(null);
  const [logAttachments, setLogAttachments] = useState<{ name: string; url: string; type: string }[]>([]);
  const [logMaterials, setLogMaterials] = useState<{ imageUrl: string; text: string }[]>([]);
  const [logLoading, setLogLoading] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [materialUploadingIdx, setMaterialUploadingIdx] = useState<number | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const materialFileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const [localLogs, setLocalLogs] = useState(logs);

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

  // ── 자료(이미지+설명) 추가/편집/삭제
  function addMaterialRow() {
    setLogMaterials((prev) => [...prev, { imageUrl: "", text: "" }]);
  }

  function updateMaterialText(i: number, text: string) {
    setLogMaterials((prev) => prev.map((m, idx) => (idx === i ? { ...m, text } : m)));
  }

  function removeMaterialRow(i: number) {
    setLogMaterials((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleMaterialImageSelect(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMaterialUploadingIdx(i);
    try {
      const result = await uploadToCloudinary(file);
      setLogMaterials((prev) => prev.map((m, idx) => (idx === i ? { ...m, imageUrl: result.url } : m)));
    } catch { /* 업로드 실패 무시 */ }
    setMaterialUploadingIdx(null);
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
        postStatusMessage: logStatusMsg,
        imageUrl: logImage ?? undefined,
        attachments: logAttachments,
        materials: logMaterials.filter((m) => m.imageUrl || m.text),
      }),
    });
    setLogLoading(false);
    if (res.ok) {
      const newLog = await res.json();
      setLocalLogs([newLog, ...localLogs]);
      setLogTitle("");
      setLogContent("");
      setLogStatusMsg("");
      setLogImage(null);
      setLogAttachments([]);
      setLogMaterials([]);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setLogError(data.error ?? `오류가 발생했습니다 (${res.status})`);
    }
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

  const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-100";

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 space-y-8">

      {/* ── 헤더 ── */}
      <section className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: NAVY }}>{project.title}</h1>
            <Badge variant="outline" className="mt-1">논문</Badge>
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
          진행자:{" "}
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
              <div className="h-2.5 rounded-full" style={{ width: `${progress}%`, background: GOLD_GRADIENT }} />
            </div>
          )}
        </div>
      </section>

      {/* ── 프로젝트 정보 (논문 전용 필드) ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{ color: NAVY }}>프로젝트 정보</h2>
          {isOwner && (
            <button
              onClick={() => setMetaEdit((v) => !v)}
              className="text-xs font-medium hover:opacity-70"
              style={{ color: NAVY }}
            >
              {metaEdit ? "취소" : "편집"}
            </button>
          )}
        </div>

        <div className="rounded-2xl p-5" style={{ border: `2px solid ${NAVY}` }}>
          {metaEdit ? (
            <div className="space-y-3">
              {THESIS_META_FIELDS.map(({ key, label }) => (
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
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {THESIS_META_FIELDS.map(({ key, label }) => (
                <div key={key}>
                  <span
                    className="inline-block text-xs font-bold px-2.5 py-1 rounded-md mb-1.5"
                    style={{ color: "#fff", background: NAVY }}
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
        </div>
      </section>

      {/* ── Update LOG ── */}
      <section>
        <h2 className="text-base font-semibold mb-4" style={{ color: NAVY }}>Update LOG</h2>

        {(isOwner || isLeadership) && (
          <form
            onSubmit={handleAddLog}
            className="mb-6 space-y-3 p-4 rounded-xl"
            style={{ border: `1.5px solid ${NAVY}`, background: "rgba(22,35,63,0.02)" }}
          >
            <Input value={logTitle} onChange={(e) => setLogTitle(e.target.value)} placeholder="업데이트 제목" required />
            <Textarea
              value={logContent}
              onChange={(e) => setLogContent(e.target.value)}
              placeholder="핵심 변경사항을 작성하세요..."
              rows={3}
              required
            />
            <div className="relative">
              <Input
                value={logStatusMsg}
                onChange={(e) => setLogStatusMsg(e.target.value.slice(0, 15))}
                placeholder="상태 메세지 (스토리에 표시됩니다) *"
                maxLength={15}
                required
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                {logStatusMsg.length}/15
              </span>
            </div>

            {/* 대표 이미지 미리보기 */}
            {logImage && (
              <div className="relative inline-block">
                <img src={logImage} alt="대표 이미지" className="h-28 rounded-lg object-cover border border-gray-200" />
                <button type="button" onClick={() => setLogImage(null)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5">
                  <X size={12} />
                </button>
              </div>
            )}

            {/* 첨부파일 목록 */}
            {logAttachments.length > 0 && (
              <div className="space-y-1">
                {logAttachments.map((att, i) => (
                  <div key={att.url} className="flex items-center gap-2 text-xs text-gray-600">
                    <Paperclip size={12} />
                    <span className="truncate flex-1">{att.name}</span>
                    <button type="button" onClick={() => setLogAttachments((prev) => prev.filter((_, j) => j !== i))} className="text-red-400">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {logError && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{logError}</p>}

            <div className="flex items-center gap-3">
              <button type="button" onClick={() => imageRef.current?.click()} disabled={imageUploading} className="flex items-center gap-1.5 text-xs text-gray-500 hover:opacity-70 transition-colors">
                <ImagePlus size={15} />
                {imageUploading ? "업로드 중..." : "대표 이미지"}
              </button>
              <button type="button" onClick={() => fileRef.current?.click()} disabled={fileUploading} className="flex items-center gap-1.5 text-xs text-gray-500 hover:opacity-70 transition-colors">
                <Paperclip size={15} />
                {fileUploading ? "업로드 중..." : "파일 첨부"}
              </button>
              <input ref={imageRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              <input ref={fileRef} type="file" multiple onChange={handleFileSelect} className="hidden" />
            </div>

            {/* 자료 및 설명 — 여러 개의 이미지+텍스트 자료 추가 */}
            <div className="pt-2" style={{ borderTop: "1px solid rgba(22,35,63,0.1)" }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold" style={{ color: NAVY }}>자료 및 설명</p>
                <button type="button" onClick={addMaterialRow} className="text-xs font-medium" style={{ color: NAVY }}>
                  + 자료 추가
                </button>
              </div>
              <div className="space-y-2">
                {logMaterials.map((m, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg p-2" style={{ border: "1px solid rgba(22,35,63,0.15)" }}>
                    <div className="shrink-0">
                      {m.imageUrl ? (
                        <img src={m.imageUrl} alt="" className="w-16 h-16 rounded object-cover" />
                      ) : (
                        <button
                          type="button"
                          onClick={() => materialFileRefs.current[i]?.click()}
                          disabled={materialUploadingIdx === i}
                          className="w-16 h-16 rounded border border-dashed flex items-center justify-center text-[10px] text-gray-400"
                        >
                          {materialUploadingIdx === i ? "업로드..." : "이미지"}
                        </button>
                      )}
                      <input
                        ref={(el) => { materialFileRefs.current[i] = el; }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleMaterialImageSelect(i, e)}
                      />
                    </div>
                    <textarea
                      value={m.text}
                      onChange={(e) => updateMaterialText(i, e.target.value)}
                      placeholder="자료 설명"
                      rows={2}
                      className={`${inputCls} resize-none flex-1`}
                    />
                    <button type="button" onClick={() => removeMaterialRow(i)} className="text-red-400 shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={logLoading}>
                {logLoading ? "추가 중..." : "업데이트 추가"}
              </Button>
            </div>
          </form>
        )}

        {/* 로그 타임라인 */}
        <div className="relative pl-5 space-y-6" style={{ borderLeft: `3px solid ${NAVY}` }}>
          {localLogs.length === 0 && <p className="text-sm text-gray-400">업데이트 로그가 없습니다.</p>}
          {localLogs.map((log) => (
            <div key={log._id} className="relative">
              <div
                className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white"
                style={{ background: NAVY }}
              />
              <p className="text-xs font-semibold mb-2" style={{ color: NAVY }}>
                Log : {new Date(log.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\./g, " /").replace(/ \/$/, "")}
              </p>
              <Link
                href={`/projects/${project._id}/logs/${log._id}`}
                className="block bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-all"
                style={{ border: `2px solid ${NAVY}`, boxShadow: "0 4px 16px rgba(191,149,63,0.2)" }}
              >
                <UpdateLogCard post={log} headTitle={project.title} />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
