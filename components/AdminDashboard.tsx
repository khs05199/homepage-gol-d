"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ALL_ROLES = ["회장", "부회장", "관리자", "서기", "동아리 전담 멘토", "부원"] as const;

const ROLE_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  회장: { label: "회장", variant: "default" },
  부회장: { label: "부회장", variant: "outline" },
  서기: { label: "서기", variant: "outline" },
  "동아리 전담 멘토": { label: "멘토", variant: "default" },
  부원: { label: "부원", variant: "secondary" },
};

export default function AdminDashboard({ members, announcements }: { members: any[]; announcements: any[] }) {
  const router = useRouter();

  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "부원" });
  const [userLoading, setUserLoading] = useState(false);
  const [userMsg, setUserMsg] = useState("");

  const [annForm, setAnnForm] = useState({ title: "", content: "", postStatusMessage: "" });
  const [annLoading, setAnnLoading] = useState(false);
  const [annMsg, setAnnMsg] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", role: "" });
  const [editLoading, setEditLoading] = useState(false);

  function handleUserChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setUserForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setUserLoading(true);
    setUserMsg("");
    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userForm),
    });
    const data = await res.json();
    setUserLoading(false);
    if (res.ok) {
      setUserMsg(`계정 생성 완료: ${data.email}`);
      setUserForm({ name: "", email: "", password: "", role: "부원" });
      router.refresh();
    } else {
      setUserMsg(data.error ?? "오류가 발생했습니다.");
    }
  }

  function openEdit(m: any) {
    setEditingId(m._id);
    setEditForm({ name: m.name, role: m.role ?? "부원" });
  }

  async function handleUpdateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setEditLoading(true);
    const res = await fetch(`/api/admin/update-user/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditLoading(false);
    if (res.ok) {
      setEditingId(null);
      router.refresh();
    }
  }

  async function handleCreateAnn(e: React.FormEvent) {
    e.preventDefault();
    setAnnLoading(true);
    setAnnMsg("");
    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(annForm),
    });
    const data = await res.json();
    setAnnLoading(false);
    if (res.ok) {
      setAnnForm({ title: "", content: "", postStatusMessage: "" });
      router.refresh();
    } else {
      setAnnMsg(data.error ?? "오류가 발생했습니다.");
    }
  }

  async function handleDeleteAnn(id: string) {
    await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      <h1 className="text-xl font-bold text-gray-900">운영진 대시보드</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">부원 계정 생성</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div className="space-y-1">
                <Label>이름</Label>
                <Input name="name" value={userForm.name} onChange={handleUserChange} required />
              </div>
              <div className="space-y-1">
                <Label>이메일</Label>
                <Input name="email" type="email" value={userForm.email} onChange={handleUserChange} required />
              </div>
              <div className="space-y-1">
                <Label>임시 비밀번호</Label>
                <Input name="password" value={userForm.password} onChange={handleUserChange} required />
              </div>
              <div className="space-y-1">
                <Label>직책</Label>
                <select name="role" value={userForm.role} onChange={handleUserChange} className="w-full border rounded-md px-3 py-2 text-sm">
                  {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {userMsg && <p className="text-sm text-blue-600">{userMsg}</p>}
              <Button type="submit" className="w-full" disabled={userLoading}>
                {userLoading ? "생성 중..." : "계정 생성"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">공지사항 작성</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAnn} className="space-y-3">
              <div className="space-y-1">
                <Label>제목</Label>
                <Input value={annForm.title} onChange={(e) => setAnnForm((p) => ({ ...p, title: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label>내용</Label>
                <Textarea value={annForm.content} onChange={(e) => setAnnForm((p) => ({ ...p, content: e.target.value }))} rows={3} required />
              </div>
              <div className="space-y-1">
                <Label>
                  상태 메세지 <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-400 ml-1">(최대 15자)</span>
                </Label>
                <div className="relative">
                  <Input
                    value={annForm.postStatusMessage}
                    onChange={(e) => setAnnForm((p) => ({ ...p, postStatusMessage: e.target.value.slice(0, 15) }))}
                    placeholder="스토리에 표시될 메세지"
                    maxLength={15}
                    required
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                    {annForm.postStatusMessage.length}/15
                  </span>
                </div>
              </div>
              {annMsg && <p className="text-sm text-red-500">{annMsg}</p>}
              <Button type="submit" className="w-full" disabled={annLoading}>
                {annLoading ? "등록 중..." : "공지 등록"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <section>
        <h2 className="text-base font-semibold mb-3">부원 목록 ({members.length}명)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-3 py-2 border">이름</th>
                <th className="px-3 py-2 border">이메일</th>
                <th className="px-3 py-2 border">직책</th>
                <th className="px-3 py-2 border">가입일</th>
                <th className="px-3 py-2 border">편집</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const badge = ROLE_BADGE[m.role] ?? { label: m.role, variant: "secondary" as const };
                const isEditing = editingId === m._id;
                return (
                  <tr key={m._id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 border">
                      {isEditing ? (
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                          className="h-7 text-xs"
                        />
                      ) : m.name}
                    </td>
                    <td className="px-3 py-2 border text-gray-500">{m.email}</td>
                    <td className="px-3 py-2 border">
                      {isEditing ? (
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}
                          className="border rounded px-2 py-1 text-xs"
                        >
                          {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      ) : (
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2 border text-gray-400">
                      {new Date(m.createdAt).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="px-3 py-2 border">
                      {isEditing ? (
                        <form onSubmit={handleUpdateUser} className="flex gap-1">
                          <Button type="submit" size="sm" className="h-6 text-xs" disabled={editLoading}>
                            {editLoading ? "저장 중" : "저장"}
                          </Button>
                          <Button type="button" size="sm" variant="outline" className="h-6 text-xs" onClick={() => setEditingId(null)}>
                            취소
                          </Button>
                        </form>
                      ) : (
                        <button onClick={() => openEdit(m)} className="text-xs text-yellow-600 hover:text-yellow-800 font-medium">
                          편집
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-3">공지사항</h2>
        <div className="space-y-2">
          {announcements.length === 0 && <p className="text-sm text-gray-400">공지사항이 없습니다.</p>}
          {announcements.map((a) => (
            <div key={a._id} className="flex items-center justify-between bg-white border rounded-lg px-4 py-2">
              <div>
                <span className="text-sm font-medium">{a.title}</span>
                {a.postStatusMessage && (
                  <span className="ml-2 text-xs text-blue-500 border border-blue-200 rounded-full px-2 py-0.5">
                    {a.postStatusMessage}
                  </span>
                )}
                <span className="text-xs text-gray-400 ml-2">{new Date(a.createdAt).toLocaleDateString("ko-KR")}</span>
              </div>
              <button onClick={() => handleDeleteAnn(a._id)} className="text-xs text-red-400 hover:text-red-600">삭제</button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
