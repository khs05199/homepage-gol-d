"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import PageLayout from "@/components/PageLayout";
import { RESOURCE_FOLDERS } from "@/lib/resourceFolders";
import {
  FileText, Megaphone, Trophy, Award, Lightbulb,
  CheckCircle, Plus, X, Paperclip, ChevronDown, ChevronRight,
  Trash2, Link2,
} from "lucide-react";

const FOLDER_ICONS: Record<string, React.ReactNode> = {
  "논문 잘 적는법": <FileText size={15} />,
  "공지사항 연혁": <Megaphone size={15} />,
  "경진대회": <Trophy size={15} />,
  "AI & 빅데이터 유튜브": <span className="text-[13px]">▶</span>,
  "자격증 자료": <Award size={15} />,
  "화석들의 학교생활 꿀팁": <Lightbulb size={15} />,
  "완료 프로젝트": <CheckCircle size={15} />,
};

const TAG_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-teal-100 text-teal-700",
];

function tagColor(tag: string) {
  let n = 0;
  for (let i = 0; i < tag.length; i++) n += tag.charCodeAt(i);
  return TAG_COLORS[n % TAG_COLORS.length];
}

export default function ResourcesPage() {
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const currentUserRole = (session?.user as any)?.role;

  const [selectedFolder, setSelectedFolder] = useState<string>(RESOURCE_FOLDERS[0]);
  const [items, setItems] = useState<any[]>([]);
  const [newFolders, setNewFolders] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formLinks, setFormLinks] = useState<string[]>([""]);
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formTagInput, setFormTagInput] = useState("");
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formAttachments, setFormAttachments] = useState<{ name: string; url: string; type: string }[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/resources/new-status")
      .then((r) => r.json())
      .then((d) => setNewFolders(d.newFolders ?? []));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/resources?folder=${encodeURIComponent(selectedFolder)}`)
      .then((r) => r.json())
      .then((d) => { setItems(d); setLoading(false); });
  }, [selectedFolder]);

  async function uploadFile(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    return await res.json();
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    const data = await uploadFile(file);
    setFormImages((prev) => [...prev, data.url]);
    setImageUploading(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setFileUploading(true);
    const uploaded = await Promise.all(files.map(async (f) => {
      const data = await uploadFile(f);
      return { name: f.name, url: data.url, type: f.type };
    }));
    setFormAttachments((prev) => [...prev, ...uploaded]);
    setFileUploading(false);
  }

  function addTag() {
    const tag = formTagInput.trim();
    if (tag && !formTags.includes(tag)) setFormTags((prev) => [...prev, tag]);
    setFormTagInput("");
  }

  function resetForm() {
    setFormTitle(""); setFormContent("");
    setFormLinks([""]); setFormTags([]);
    setFormTagInput(""); setFormImages([]);
    setFormAttachments([]); setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        folder: selectedFolder,
        title: formTitle,
        content: formContent,
        links: formLinks.filter(Boolean),
        tags: formTags,
        imageUrls: formImages,
        attachments: formAttachments,
      }),
    });
    if (res.ok) {
      const newItem = await res.json();
      setItems((prev) => [newItem, ...prev]);
      setNewFolders((prev) => prev.includes(selectedFolder) ? prev : [...prev, selectedFolder]);
      resetForm();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("삭제하시겠습니까?")) return;
    const res = await fetch(`/api/resources/${id}`, { method: "DELETE" });
    if (res.ok) setItems((prev) => prev.filter((i) => i._id !== id));
  }

  const isLeaderRole = ["회장", "부회장", "관리자"].includes(currentUserRole);

  return (
    <PageLayout>
      <div className="flex h-screen overflow-hidden">
        {/* ── 왼쪽 폴더 패널 ── */}
        <aside className="w-56 border-r border-gray-100 bg-white flex-shrink-0 overflow-y-auto py-6">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-5 mb-3">폴더</p>
          {RESOURCE_FOLDERS.map((folder) => {
            const active = selectedFolder === folder;
            const isNew = newFolders.includes(folder);
            return (
              <button
                key={folder}
                onClick={() => { setSelectedFolder(folder); setShowForm(false); }}
                className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-sm font-medium transition-all text-left relative ${
                  active
                    ? "text-yellow-700 bg-yellow-50/60 border-r-2 border-yellow-400"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <span className={active ? "text-yellow-500" : "text-gray-400"}>
                  {FOLDER_ICONS[folder]}
                </span>
                <span className="truncate">{folder}</span>
                {isNew && (
                  <span className="ml-auto text-[9px] font-bold text-white bg-red-500 rounded-full w-4 h-4 flex items-center justify-center shrink-0">
                    N
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* ── 오른쪽 콘텐츠 ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="text-yellow-500">{FOLDER_ICONS[selectedFolder]}</span>
                <h1 className="text-lg font-bold text-gray-900">{selectedFolder}</h1>
                {newFolders.includes(selectedFolder) && (
                  <span className="text-[9px] font-bold text-white bg-red-500 rounded-full px-1.5 py-0.5">NEW</span>
                )}
              </div>
              <button
                onClick={() => setShowForm((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-900 hover:opacity-90 transition-all"
                style={{ background: "linear-gradient(135deg, #D4A017 0%, #F5C518 100%)" }}
              >
                <Plus size={13} /> 자료 추가
              </button>
            </div>

            {/* 추가 폼 */}
            {showForm && (
              <form onSubmit={handleSubmit} className="mb-5 p-5 rounded-2xl border border-yellow-200 bg-yellow-50/30 space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-bold text-gray-800">새 자료 추가</p>
                  <button type="button" onClick={resetForm}><X size={16} className="text-gray-400" /></button>
                </div>

                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="제목 *"
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-yellow-400"
                />

                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="내용 (텍스트, 코드 등)"
                  rows={5}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-yellow-400 resize-none font-mono"
                />

                {/* 태그 */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1.5">태그</p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {formTags.map((tag) => (
                      <span key={tag} className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${tagColor(tag)}`}>
                        {tag}
                        <button type="button" onClick={() => setFormTags((prev) => prev.filter((t) => t !== tag))}>
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={formTagInput}
                      onChange={(e) => setFormTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                      placeholder="태그 입력 후 Enter"
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-yellow-400"
                    />
                    <button type="button" onClick={addTag} className="px-3 py-2 rounded-xl bg-gray-100 text-xs text-gray-600 hover:bg-gray-200">
                      추가
                    </button>
                  </div>
                </div>

                {/* 링크 */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1.5">링크 (유튜브 등)</p>
                  {formLinks.map((link, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input
                        value={link}
                        onChange={(e) => {
                          const arr = [...formLinks];
                          arr[i] = e.target.value;
                          setFormLinks(arr);
                        }}
                        placeholder="https://..."
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-yellow-400"
                      />
                      <button type="button" onClick={() => setFormLinks((prev) => prev.filter((_, j) => j !== i))} className="text-red-400">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setFormLinks((prev) => [...prev, ""])} className="text-xs text-yellow-600 hover:text-yellow-700">
                    + 링크 추가
                  </button>
                </div>

                {/* 이미지 미리보기 */}
                {formImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {formImages.map((url, i) => (
                      <div key={url} className="relative rounded-lg overflow-hidden aspect-square">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormImages((prev) => prev.filter((_, j) => j !== i))}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 파일 첨부 목록 */}
                {formAttachments.map((att, i) => (
                  <div key={att.url} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                    <Paperclip size={12} />
                    <span className="flex-1 truncate">{att.name}</span>
                    <button type="button" onClick={() => setFormAttachments((prev) => prev.filter((_, j) => j !== i))} className="text-red-400">
                      <X size={12} />
                    </button>
                  </div>
                ))}

                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => imageRef.current?.click()} disabled={imageUploading}
                    className="text-xs text-gray-500 hover:text-yellow-600 flex items-center gap-1">
                    📷 {imageUploading ? "업로드 중..." : "사진 추가"}
                  </button>
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={fileUploading}
                    className="text-xs text-gray-500 hover:text-yellow-600 flex items-center gap-1">
                    <Paperclip size={13} /> {fileUploading ? "업로드 중..." : "파일 첨부"}
                  </button>
                  <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
                  <button
                    type="submit"
                    className="ml-auto px-4 py-2 rounded-xl text-xs font-bold text-gray-900"
                    style={{ background: "linear-gradient(135deg, #D4A017 0%, #F5C518 100%)" }}
                  >
                    저장
                  </button>
                </div>
              </form>
            )}

            {/* 아이템 리스트 */}
            {loading ? (
              <div className="text-center py-20 text-sm text-gray-400">불러오는 중...</div>
            ) : items.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-300 text-sm">아직 자료가 없습니다.</p>
                <p className="text-gray-400 text-xs mt-1">위의 &apos;자료 추가&apos; 버튼으로 첫 자료를 등록해보세요.</p>
              </div>
            ) : (
              <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
                {/* 테이블 헤더 */}
                <div className="grid grid-cols-[auto_1fr_auto] items-center px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500">
                  <span className="w-5" />
                  <span className="ml-3">이름</span>
                  <span>태그</span>
                </div>

                {items.map((item, idx) => {
                  const isOpen = expandedId === item._id;
                  const canDelete = currentUserId === item.authorId?._id || isLeaderRole;
                  return (
                    <div key={item._id} className={idx !== 0 ? "border-t border-gray-50" : ""}>
                      {/* 행 */}
                      <div
                        className="grid grid-cols-[auto_1fr_auto] items-center px-4 py-3 hover:bg-gray-50/50 cursor-pointer transition-colors"
                        onClick={() => setExpandedId(isOpen ? null : item._id)}
                      >
                        <span className="text-gray-400 w-5 flex items-center">
                          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </span>
                        <div className="flex items-center gap-2.5 ml-1 min-w-0">
                          <span className="text-gray-400">{FOLDER_ICONS[selectedFolder]}</span>
                          <span className="text-sm text-gray-800 font-medium truncate">{item.title}</span>
                          <span className="text-xs text-gray-400 shrink-0">
                            {item.authorId?.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 ml-4">
                          {(item.tags ?? []).map((tag: string) => (
                            <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tagColor(tag)}`}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* 펼침 콘텐츠 */}
                      {isOpen && (
                        <div className="px-10 py-4 bg-gray-50/30 border-t border-gray-100 space-y-4">
                          {item.content && (
                            <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans bg-white border border-gray-100 rounded-xl p-4">
                              {item.content}
                            </pre>
                          )}
                          {item.imageUrls?.length > 0 && (
                            <div className="grid grid-cols-2 gap-3">
                              {item.imageUrls.map((url: string) => (
                                <img key={url} src={url} alt="" className="w-full rounded-xl object-cover max-h-64 border border-gray-100" />
                              ))}
                            </div>
                          )}
                          {item.links?.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-xs font-semibold text-gray-500 flex items-center gap-1"><Link2 size={12} /> 링크</p>
                              {item.links.map((link: string) => (
                                <a key={link} href={link} target="_blank" rel="noopener noreferrer"
                                  className="block text-xs text-blue-500 hover:underline truncate">{link}</a>
                              ))}
                            </div>
                          )}
                          {item.attachments?.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-xs font-semibold text-gray-500 flex items-center gap-1"><Paperclip size={12} /> 첨부파일</p>
                              {item.attachments.map((att: any) => (
                                <a key={att.url} href={att.url} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-xs text-blue-500 hover:underline">
                                  <Paperclip size={11} /> {att.name}
                                </a>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-400">
                              {item.authorId?.name} · {new Date(item.createdAt).toLocaleDateString("ko-KR")}
                            </p>
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(item._id)}
                                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600"
                              >
                                <Trash2 size={12} /> 삭제
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
