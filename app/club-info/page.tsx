"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import PageLayout from "@/components/PageLayout";
import { isLeadership } from "@/lib/roles";
import { Plus, X, Pencil, Check } from "lucide-react";

export default function ClubInfoPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const canEdit = isLeadership(role);

  const [info, setInfo] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    meaningOfName: "",
    coreValues: [{ title: "", description: "" }, { title: "", description: "" }, { title: "", description: "" }],
    thingsToLearn: [""],
    mainActivities: [{ description: "", imageUrl: "" }],
    photos: [],
  });
  const [photoUploading, setPhotoUploading] = useState(false);
  const [actPhotoUploading, setActPhotoUploading] = useState<number | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const actPhotoRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    fetch("/api/club-info")
      .then((r) => r.json())
      .then((d) => {
        setInfo(d);
        if (d && Object.keys(d).length > 0) {
          setForm({
            meaningOfName: d.meaningOfName ?? "",
            coreValues: d.coreValues?.length ? d.coreValues : [{ title: "", description: "" }, { title: "", description: "" }, { title: "", description: "" }],
            thingsToLearn: d.thingsToLearn?.length ? d.thingsToLearn : [""],
            mainActivities: d.mainActivities?.length ? d.mainActivities : [{ description: "", imageUrl: "" }],
            photos: d.photos ?? [],
          });
        }
      });
  }, []);

  async function uploadImage(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    return data.url;
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    const url = await uploadImage(file);
    setForm((prev: any) => ({ ...prev, photos: [...prev.photos, url] }));
    setPhotoUploading(false);
  }

  async function handleActivityPhotoUpload(idx: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setActPhotoUploading(idx);
    const url = await uploadImage(file);
    setForm((prev: any) => {
      const acts = [...prev.mainActivities];
      acts[idx] = { ...acts[idx], imageUrl: url };
      return { ...prev, mainActivities: acts };
    });
    setActPhotoUploading(null);
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/club-info", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const updated = await fetch("/api/club-info").then((r) => r.json());
    setInfo(updated);
    setEditing(false);
    setSaving(false);
  }

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-100 transition-all";

  return (
    <PageLayout>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">동아리 정보</h1>
            <p className="text-sm text-gray-400 mt-1">GOL:D 동아리 소개 및 핵심 정보</p>
          </div>
          {canEdit && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-900 hover:opacity-90 transition-all"
              style={{ background: "linear-gradient(135deg, #D4A017 0%, #F5C518 100%)" }}
            >
              <Pencil size={14} /> 편집
            </button>
          )}
          {editing && (
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-900 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #D4A017 0%, #F5C518 100%)" }}
              >
                <Check size={14} /> {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* 동아리 이름의 의미 */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-yellow-500 text-lg">◆</span> GOL:D 이름의 의미
            </h2>
            {editing ? (
              <textarea
                value={form.meaningOfName}
                onChange={(e) => setForm((p: any) => ({ ...p, meaningOfName: e.target.value }))}
                rows={4}
                placeholder="동아리 이름 GOL:D의 의미와 배경을 작성하세요"
                className={`${inputCls} resize-none`}
              />
            ) : (
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                {info?.meaningOfName || <span className="text-gray-300 italic">내용을 입력해주세요</span>}
              </p>
            )}
          </section>

          {/* 핵심 가치 */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-yellow-500 text-lg">◆</span> 핵심 가치 3가지
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(editing ? form.coreValues : (info?.coreValues ?? [])).map((cv: any, i: number) => (
                <div key={i} className="rounded-xl p-4 border border-yellow-100 bg-yellow-50/40">
                  {editing ? (
                    <div className="space-y-2">
                      <input
                        value={cv.title}
                        onChange={(e) => {
                          const vals = [...form.coreValues];
                          vals[i] = { ...vals[i], title: e.target.value };
                          setForm((p: any) => ({ ...p, coreValues: vals }));
                        }}
                        placeholder={`핵심가치 ${i + 1} 제목`}
                        className={inputCls}
                      />
                      <textarea
                        value={cv.description}
                        onChange={(e) => {
                          const vals = [...form.coreValues];
                          vals[i] = { ...vals[i], description: e.target.value };
                          setForm((p: any) => ({ ...p, coreValues: vals }));
                        }}
                        rows={3}
                        placeholder="설명"
                        className={`${inputCls} resize-none`}
                      />
                    </div>
                  ) : (
                    <>
                      <p className="font-bold text-gray-900 mb-2">{cv.title || `핵심가치 ${i + 1}`}</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{cv.description || <span className="text-gray-300 italic">미입력</span>}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 배울 수 있는 것들 */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="text-yellow-500 text-lg">◆</span> 배울 수 있는 것들
              </h2>
              {editing && (
                <button
                  onClick={() => setForm((p: any) => ({ ...p, thingsToLearn: [...p.thingsToLearn, ""] }))}
                  className="flex items-center gap-1 text-xs text-yellow-600 hover:text-yellow-700"
                >
                  <Plus size={14} /> 추가
                </button>
              )}
            </div>
            {editing ? (
              <div className="space-y-2">
                {form.thingsToLearn.map((item: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={item}
                      onChange={(e) => {
                        const arr = [...form.thingsToLearn];
                        arr[i] = e.target.value;
                        setForm((p: any) => ({ ...p, thingsToLearn: arr }));
                      }}
                      placeholder="예: Python, 머신러닝, 논문 작성법"
                      className={`${inputCls} flex-1`}
                    />
                    <button
                      onClick={() => setForm((p: any) => ({ ...p, thingsToLearn: p.thingsToLearn.filter((_: any, j: number) => j !== i) }))}
                      className="text-red-400 hover:text-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(info?.thingsToLearn ?? []).map((item: string, i: number) => (
                  <span key={i} className="text-sm px-3 py-1.5 rounded-full font-medium text-gray-700" style={{ background: "rgba(255,215,0,0.15)", border: "1px solid #FFD700" }}>
                    {item}
                  </span>
                ))}
                {!(info?.thingsToLearn?.length) && <span className="text-gray-300 italic text-sm">내용을 입력해주세요</span>}
              </div>
            )}
          </section>

          {/* 주요 활동 */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="text-yellow-500 text-lg">◆</span> 주요 활동
              </h2>
              {editing && (
                <button
                  onClick={() => setForm((p: any) => ({ ...p, mainActivities: [...p.mainActivities, { description: "", imageUrl: "" }] }))}
                  className="flex items-center gap-1 text-xs text-yellow-600 hover:text-yellow-700"
                >
                  <Plus size={14} /> 활동 추가
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(editing ? form.mainActivities : (info?.mainActivities ?? [])).map((act: any, i: number) => (
                <div key={i} className="rounded-xl border border-gray-100 overflow-hidden">
                  {editing ? (
                    <div className="p-4 space-y-3">
                      <div className="relative">
                        {act.imageUrl ? (
                          <div className="relative">
                            <img src={act.imageUrl} alt="" className="w-full h-32 object-cover rounded-lg" />
                            <button
                              type="button"
                              onClick={() => {
                                const acts = [...form.mainActivities];
                                acts[i] = { ...acts[i], imageUrl: "" };
                                setForm((p: any) => ({ ...p, mainActivities: acts }));
                              }}
                              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => actPhotoRefs.current[i]?.click()}
                            disabled={actPhotoUploading === i}
                            className="w-full h-28 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400 hover:border-yellow-300 hover:text-yellow-500 transition-colors"
                          >
                            {actPhotoUploading === i ? "업로드 중..." : "+ 사진 추가"}
                          </button>
                        )}
                        <input
                          ref={(el) => { actPhotoRefs.current[i] = el; }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleActivityPhotoUpload(i, e)}
                        />
                      </div>
                      <textarea
                        value={act.description}
                        onChange={(e) => {
                          const acts = [...form.mainActivities];
                          acts[i] = { ...acts[i], description: e.target.value };
                          setForm((p: any) => ({ ...p, mainActivities: acts }));
                        }}
                        rows={3}
                        placeholder="활동 설명"
                        className={`${inputCls} resize-none`}
                      />
                      {form.mainActivities.length > 1 && (
                        <button
                          onClick={() => setForm((p: any) => ({ ...p, mainActivities: p.mainActivities.filter((_: any, j: number) => j !== i) }))}
                          className="text-xs text-red-400 hover:text-red-600"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {act.imageUrl && <img src={act.imageUrl} alt="" className="w-full h-40 object-cover" />}
                      <p className="text-sm text-gray-700 p-4 leading-relaxed">{act.description}</p>
                    </>
                  )}
                </div>
              ))}
              {!editing && !(info?.mainActivities?.length) && (
                <p className="text-gray-300 italic text-sm col-span-2">내용을 입력해주세요</p>
              )}
            </div>
          </section>

          {/* 사진 갤러리 */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="text-yellow-500 text-lg">◆</span> 활동 사진
              </h2>
              {editing && (
                <button
                  onClick={() => photoRef.current?.click()}
                  disabled={photoUploading}
                  className="flex items-center gap-1 text-xs text-yellow-600 hover:text-yellow-700"
                >
                  <Plus size={14} /> {photoUploading ? "업로드 중..." : "사진 추가"}
                </button>
              )}
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(editing ? form.photos : (info?.photos ?? [])).map((url: string, i: number) => (
                <div key={url} className="relative rounded-xl overflow-hidden aspect-square">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  {editing && (
                    <button
                      onClick={() => setForm((p: any) => ({ ...p, photos: p.photos.filter((_: any, j: number) => j !== i) }))}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
              {!(editing ? form.photos : (info?.photos ?? [])).length && (
                <p className="text-gray-300 italic text-sm col-span-4">사진이 없습니다</p>
              )}
            </div>
          </section>
        </div>
      </main>
    </PageLayout>
  );
}
