"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageLayout from "@/components/PageLayout";
import { Plus, Trash2, FolderOpen, ImagePlus } from "lucide-react";

type PersonalStatus = "준비 중" | "진행 중" | "완료";

interface MyProject {
  _id: string;
  title: string;
  type: string;
  description?: string;
  approvalStatus: string;
  progressPercentage: number;
  hasLogs: boolean;
  personalStatus: PersonalStatus;
  createdAt: string;
  imageUrl?: string;
}

const STATUS_TEXT_COLOR: Record<PersonalStatus, string> = {
  "준비 중": "text-emerald-500",
  "진행 중": "text-blue-500",
  "완료": "text-red-400",
};

const STATUS_LABEL: Record<PersonalStatus, string> = {
  "준비 중": "준비 중..",
  "진행 중": "진행 중..",
  "완료": "완료",
};

const STATUS_STATS_COLOR: Record<PersonalStatus, string> = {
  "준비 중": "text-emerald-400",
  "진행 중": "text-blue-400",
  "완료": "text-red-400",
};

const EMPTY_FORM = { title: "", type: "개발", description: "", startDate: "", imageUrl: "" };

export default function MyProjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [projects, setProjects] = useState<MyProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  function fetchProjects() {
    return fetch("/api/me/projects")
      .then((r) => r.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]));
  }

  useEffect(() => {
    if (status === "authenticated") {
      fetchProjects().finally(() => setLoading(false));
    }
  }, [status]);

  const counts: Record<PersonalStatus, number> = {
    "준비 중": projects.filter((p) => p.personalStatus === "준비 중").length,
    "진행 중": projects.filter((p) => p.personalStatus === "진행 중").length,
    "완료": projects.filter((p) => p.personalStatus === "완료").length,
  };

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) {
      setForm((p) => ({ ...p, imageUrl: data.url }));
      setImagePreview(data.url);
    } else {
      setFormError("이미지 업로드에 실패했습니다.");
    }
    setUploading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setFormError("제목을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json();
      setFormError(data.error ?? "오류가 발생했습니다.");
      return;
    }
    setShowModal(false);
    setForm(EMPTY_FORM);
    setImagePreview("");
    await fetchProjects();
  }

  function openModal() {
    setFormError("");
    setForm(EMPTY_FORM);
    setImagePreview("");
    setShowModal(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("프로젝트를 삭제하면 관련 로그도 모두 삭제됩니다. 계속하시겠습니까?")) return;
    setDeleting(id);
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    setProjects((prev) => prev.filter((p) => p._id !== id));
    setDeleting(null);
  }

  const user = session?.user;
  const nameInitial = (user?.name ?? "?")[0].toUpperCase();

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition-all";

  return (
    <PageLayout>
      <div className="h-screen flex flex-col bg-white">
        {/* 상단 타이틀바 */}
        <div className="px-8 pt-7 pb-5 border-b border-gray-100 flex-shrink-0">
          <h1 className="text-xl font-bold text-gray-900">개인 프로필 및 프로젝트 관리</h1>
        </div>

        {/* 스크롤 가능한 메인 영역 */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {/* 프로필 + 통계 */}
          <div className="flex items-center gap-4 mb-7 flex-wrap">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black text-gray-900 flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #D4A017, #F5C518)" }}
            >
              {nameInitial}
            </div>
            <p className="text-lg font-bold text-gray-900">{user?.name ?? "..."}</p>

            <div
              className="ml-auto flex items-center gap-1 px-5 py-3 rounded-xl text-sm font-bold flex-wrap gap-y-2"
              style={{ backgroundColor: "#111827" }}
            >
              <span className="text-white mr-3">총 프로젝트 수</span>
              <span className={`${STATUS_STATS_COLOR["준비 중"]} mr-4`}>
                준비 중 : {counts["준비 중"]}개
              </span>
              <span className={`${STATUS_STATS_COLOR["진행 중"]} mr-4`}>
                진행 중 : {counts["진행 중"]}개
              </span>
              <span className={STATUS_STATS_COLOR["완료"]}>
                완료 : {counts["완료"]}개
              </span>
            </div>
          </div>

          {/* 프로젝트 그리드 */}
          {loading ? (
            <div className="text-center py-24 text-gray-400 text-sm">불러오는 중...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project._id}
                  className="relative rounded-2xl border-2 p-3 group flex flex-col"
                  style={{ borderColor: "#F5C518", backgroundColor: "#fffef7" }}
                >
                  {/* 삭제 버튼 (hover 시 표시) */}
                  <button
                    onClick={() => handleDelete(project._id)}
                    disabled={deleting === project._id}
                    title="삭제"
                    className="absolute top-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-400 disabled:opacity-50"
                  >
                    <Trash2 size={13} />
                  </button>

                  {/* 제목 */}
                  <p className="text-sm font-bold text-gray-800 mb-2 pr-7 line-clamp-1">
                    {project.title}
                  </p>

                  {/* 내부 카드 (클릭 → 프로젝트 상세) */}
                  <Link
                    href={`/projects/${project._id}`}
                    className="flex-1 rounded-xl border-2 flex flex-col items-center justify-center min-h-[160px] hover:bg-yellow-50/40 transition-colors relative overflow-hidden"
                    style={{ borderColor: "#F5C518" }}
                  >
                    {/* 상태 뱃지 */}
                    <span
                      className={`absolute top-2 right-2.5 text-xs font-bold z-10 ${STATUS_TEXT_COLOR[project.personalStatus]}`}
                    >
                      {STATUS_LABEL[project.personalStatus]}
                    </span>

                    {project.imageUrl ? (
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <FolderOpen size={36} className="text-yellow-300 mb-2" />
                        <span className="text-xs text-yellow-500 font-medium">{project.type}</span>
                      </>
                    )}
                  </Link>
                </div>
              ))}

              {/* + 추가 카드 */}
              <button
                onClick={openModal}
                className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center min-h-[220px] hover:border-yellow-400 hover:bg-yellow-50/20 transition-all text-gray-400 hover:text-yellow-500"
                style={{ borderColor: "#d1d5db" }}
              >
                <Plus size={28} className="mb-1.5" />
                <span className="text-sm font-semibold">+ 추가</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 추가 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />

          <div className="relative bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-6">새 프로젝트 추가</h2>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* 제목 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  제목 <span className="text-yellow-500">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  required
                  placeholder="프로젝트 이름"
                  className={inputClass}
                />
              </div>

              {/* 유형 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  유형 <span className="text-yellow-500">*</span>
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                  className={`${inputClass} bg-white`}
                >
                  <option value="개발">개발</option>
                  <option value="논문">논문</option>
                  <option value="공모전">공모전</option>
                </select>
              </div>

              {/* 설명 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">설명</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  placeholder="프로젝트 설명 (선택)"
                  className={`${inputClass} resize-none leading-relaxed`}
                />
              </div>

              {/* 시작일 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">시작일</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                  className={inputClass}
                />
              </div>

              {/* 이미지 업로드 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  대표 이미지
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />

                {imagePreview ? (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200">
                    <img src={imagePreview} alt="미리보기" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview("");
                        setForm((p) => ({ ...p, imageUrl: "" }));
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg hover:bg-black/70 transition-colors"
                    >
                      제거
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full h-32 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-yellow-400 hover:text-yellow-500 transition-all disabled:opacity-50"
                  >
                    <ImagePlus size={24} />
                    <span className="text-xs font-medium">
                      {uploading ? "업로드 중..." : "클릭하여 이미지 선택"}
                    </span>
                  </button>
                )}
              </div>

              {formError && (
                <p className="text-red-500 text-sm bg-red-50 px-4 py-2.5 rounded-xl">
                  {formError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-gray-900 disabled:opacity-60 hover:opacity-90 transition-all"
                  style={{ background: "linear-gradient(135deg, #D4A017, #F5C518)" }}
                >
                  {submitting ? "생성 중..." : "만들기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
