"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import PageLayout from "@/components/PageLayout";
import { ChevronDown, Plus, Trash2, Pencil, ImagePlus, X } from "lucide-react";

const CAN_EDIT_ROLES = ["회장", "부회장", "서기", "동아리 전담 멘토"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function canEdit(role?: string) {
  return !!role && CAN_EDIT_ROLES.includes(role);
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function toDateInput(dateStr: string) {
  return new Date(dateStr).toISOString().slice(0, 10);
}

function toTimeInput(dateStr: string) {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const EMPTY_FORM = {
  title: "",
  date: "",
  time: "",
  locationOrLink: "",
  notes: "",
  participantIds: [] as string[],
  imageUrl: "",
};

/* ─── 썸네일 카드 ─── */
function MeetingCard({
  meeting,
  selected,
  onClick,
}: {
  meeting: any;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border-2 p-3 flex flex-col transition-all"
      style={{
        borderColor: "#F5C518",
        backgroundColor: selected ? "#fffaed" : "#fffef7",
        boxShadow: selected ? "0 0 0 2px #D4A017" : undefined,
      }}
    >
      <p className="text-sm font-bold text-gray-800 mb-2 line-clamp-1">{meeting.title}</p>
      <div
        className="flex-1 rounded-xl border-2 flex items-center justify-center min-h-[120px] overflow-hidden"
        style={{ borderColor: "#F5C518" }}
      >
        {meeting.imageUrl ? (
          <img src={meeting.imageUrl} alt={meeting.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs text-yellow-400 font-medium">이미지</span>
        )}
      </div>
    </button>
  );
}

/* ─── 상세 패널 ─── */
function MeetingDetail({
  meeting,
  canEditMeeting,
  onEdit,
  onDelete,
}: {
  meeting: any;
  canEditMeeting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="rounded-2xl border-2 p-5 h-full flex flex-col"
      style={{ borderColor: "#F5C518", backgroundColor: "#fffef7" }}
    >
      {/* 제목 + 시간/장소 */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <h2 className="text-base font-bold text-gray-900">{meeting.title}</h2>
        <div className="text-xs text-gray-600 text-right shrink-0 space-y-0.5">
          <p>시간 : {formatTime(meeting.date)}</p>
          <p>장소 : {meeting.locationOrLink || "미정"}</p>
        </div>
      </div>

      {/* 참여자 */}
      {meeting.participantIds?.length > 0 && (
        <div
          className="flex flex-wrap gap-2 mb-4 p-3 rounded-xl border"
          style={{ borderColor: "#F5C518" }}
        >
          {meeting.participantIds.map((p: any) => (
            <span
              key={p._id}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "#FFF8DC", border: "1.5px solid #D4A017", color: "#7A5800" }}
            >
              {p.name}
              <ChevronDown size={10} className="text-yellow-600" />
            </span>
          ))}
        </div>
      )}

      {/* 내용 */}
      <div
        className="flex-1 rounded-xl border p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed overflow-y-auto"
        style={{ borderColor: "#F5C518", minHeight: "200px" }}
      >
        {meeting.notes || <span className="text-gray-300">회의 내용이 없습니다.</span>}
      </div>

      {/* 수정/삭제 버튼 */}
      {canEditMeeting && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-gray-900 hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #D4A017, #F5C518)" }}
          >
            <Pencil size={13} /> 수정
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-red-500 border border-red-200 hover:bg-red-50"
          >
            <Trash2 size={13} /> 삭제
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── 메인 페이지 ─── */
export default function MeetingsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const hasEditPerm = canEdit(role);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const selected = meetings.find((m) => m._id === selectedId) ?? null;

  function fetchMeetings() {
    return fetch(`/api/meetings?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((d) => setMeetings(Array.isArray(d) ? d : []))
      .catch(() => setMeetings([]));
  }

  useEffect(() => {
    setLoading(true);
    setSelectedId(null);
    fetchMeetings().finally(() => setLoading(false));
  }, [year, month]);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => setAllMembers(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  function openAddModal() {
    const defaultDate = `${year}-${String(month).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;
    setEditingId(null);
    setForm({ ...EMPTY_FORM, date: defaultDate, title: `${month}월 회의록` });
    setImagePreview("");
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(meeting: any) {
    setEditingId(meeting._id);
    setForm({
      title: meeting.title,
      date: toDateInput(meeting.date),
      time: toTimeInput(meeting.date),
      locationOrLink: meeting.locationOrLink ?? "",
      notes: meeting.notes ?? "",
      participantIds: (meeting.participantIds ?? []).map((p: any) => p._id ?? p),
      imageUrl: meeting.imageUrl ?? "",
    });
    setImagePreview(meeting.imageUrl ?? "");
    setFormError("");
    setShowModal(true);
  }

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.date) {
      setFormError("제목과 날짜는 필수입니다.");
      return;
    }
    setSubmitting(true);
    setFormError("");

    const method = editingId ? "PATCH" : "POST";
    const url = editingId ? `/api/meetings/${editingId}` : "/api/meetings";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSubmitting(false);

    if (!res.ok) {
      const d = await res.json();
      setFormError(d.error ?? "오류가 발생했습니다.");
      return;
    }

    const saved = await res.json();
    setShowModal(false);
    await fetchMeetings();
    setSelectedId(saved._id ?? editingId);
  }

  async function handleDelete(id: string) {
    if (!confirm("회의록을 삭제하시겠습니까?")) return;
    await fetch(`/api/meetings/${id}`, { method: "DELETE" });
    setMeetings((prev) => prev.filter((m) => m._id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function toggleParticipant(id: string) {
    setForm((p) => ({
      ...p,
      participantIds: p.participantIds.includes(id)
        ? p.participantIds.filter((x) => x !== id)
        : [...p.participantIds, id],
    }));
  }

  const inputClass =
    "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition-all";

  return (
    <PageLayout>
      <div className="h-screen flex flex-col bg-white">
        {/* 헤더 */}
        <div
          className="flex items-center justify-between px-8 py-5 flex-shrink-0"
          style={{ background: "linear-gradient(90deg, #111827 0%, #1f2937 100%)" }}
        >
          <h1 className="text-xl font-black text-yellow-400 tracking-tight">동아리 회의록</h1>
          <div className="flex items-center gap-3">
            {/* 연도 선택 */}
            <div className="relative">
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="appearance-none font-bold text-sm px-4 py-2 pr-8 rounded-xl text-white cursor-pointer"
                style={{ backgroundColor: "#111" }}
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}년</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-yellow-400 pointer-events-none" />
            </div>

            {/* 월 선택 */}
            <div className="relative">
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="appearance-none font-bold text-sm px-4 py-2 pr-8 rounded-xl text-white cursor-pointer"
                style={{ backgroundColor: "#111" }}
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>{m}월</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-yellow-400 pointer-events-none" />
            </div>

            {hasEditPerm && (
              <button
                onClick={openAddModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-gray-900 hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #D4A017, #F5C518)" }}
              >
                <Plus size={14} /> 새 회의록 추가
              </button>
            )}
          </div>
        </div>

        {/* 본문: 좌우 분리 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 왼쪽: 카드 목록 */}
          <div className="w-[42%] overflow-y-auto px-6 py-5 border-r border-gray-100">
            {loading ? (
              <p className="text-center text-gray-400 text-sm mt-12">불러오는 중...</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {meetings.map((m) => (
                  <MeetingCard
                    key={m._id}
                    meeting={m}
                    selected={selectedId === m._id}
                    onClick={() => setSelectedId(m._id)}
                  />
                ))}

                {/* + 추가 카드 (권한 있을 때) */}
                {hasEditPerm && (
                  <button
                    onClick={openAddModal}
                    className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center min-h-[180px] hover:border-yellow-400 hover:bg-yellow-50/20 transition-all text-gray-400 hover:text-yellow-500"
                    style={{ borderColor: "#d1d5db" }}
                  >
                    <Plus size={24} className="mb-1" />
                    <span className="text-sm font-semibold">+ 추가</span>
                  </button>
                )}

                {meetings.length === 0 && !hasEditPerm && (
                  <p className="col-span-2 text-center text-gray-400 text-sm mt-12">
                    {month}월에 등록된 회의록이 없습니다.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 오른쪽: 상세 패널 */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {selected ? (
              <MeetingDetail
                meeting={selected}
                canEditMeeting={hasEditPerm}
                onEdit={() => openEditModal(selected)}
                onDelete={() => handleDelete(selected._id)}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-300 text-sm">
                왼쪽 목록에서 회의록을 선택하세요.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 추가/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl p-7 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? "회의록 수정" : "새 회의록 추가"}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 제목 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  제목 <span className="text-yellow-500">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  required
                  placeholder="예: 6월 정기 회의록"
                  className={inputClass}
                />
              </div>

              {/* 날짜 + 시간 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    날짜 <span className="text-yellow-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">시간</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* 장소 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">장소</label>
                <input
                  value={form.locationOrLink}
                  onChange={(e) => setForm((p) => ({ ...p, locationOrLink: e.target.value }))}
                  placeholder="오프라인 장소 또는 온라인 링크"
                  className={inputClass}
                />
              </div>

              {/* 참여자 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">참여자</label>
                <div className="border border-gray-200 rounded-xl p-3 max-h-36 overflow-y-auto grid grid-cols-2 gap-1.5">
                  {allMembers.map((m) => {
                    const checked = form.participantIds.includes(m._id);
                    return (
                      <label
                        key={m._id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-yellow-50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleParticipant(m._id)}
                          className="accent-yellow-500"
                        />
                        <span className="text-xs text-gray-700 truncate">{m.name}</span>
                        <span className="text-[9px] text-gray-400 shrink-0">({m.role})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 회의 내용 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">회의 내용</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={5}
                  placeholder="회의 내용, 안건, 결정사항 등을 작성하세요."
                  className={`${inputClass} resize-none leading-relaxed`}
                />
              </div>

              {/* 이미지 업로드 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">대표 이미지</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                {imagePreview ? (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-200">
                    <img src={imagePreview} alt="미리보기" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview("");
                        setForm((p) => ({ ...p, imageUrl: "" }));
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg"
                    >
                      제거
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full h-24 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-yellow-400 hover:text-yellow-500 transition-all disabled:opacity-50"
                  >
                    <ImagePlus size={20} />
                    <span className="text-xs font-medium">
                      {uploading ? "업로드 중..." : "클릭하여 이미지 선택"}
                    </span>
                  </button>
                )}
              </div>

              {formError && (
                <p className="text-red-500 text-sm bg-red-50 px-4 py-2.5 rounded-xl">{formError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-gray-900 disabled:opacity-60 hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #D4A017, #F5C518)" }}
                >
                  {submitting ? "저장 중..." : editingId ? "수정 완료" : "추가"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
