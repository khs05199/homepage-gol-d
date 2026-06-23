"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ROLE_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  회장: { label: "회장", variant: "default" },
  부회장: { label: "부회장", variant: "outline" },
  부원: { label: "부원", variant: "secondary" },
};

export default function AdminDashboard({ members, announcements }: { members: any[]; announcements: any[] }) {
  const router = useRouter();

  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "부원" });
  const [userLoading, setUserLoading] = useState(false);
  const [userMsg, setUserMsg] = useState("");

  const [annForm, setAnnForm] = useState({ title: "", content: "" });
  const [annLoading, setAnnLoading] = useState(false);

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

  async function handleCreateAnn(e: React.FormEvent) {
    e.preventDefault();
    setAnnLoading(true);
    await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(annForm),
    });
    setAnnLoading(false);
    setAnnForm({ title: "", content: "" });
    router.refresh();
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
                  <option value="부원">부원</option>
                  <option value="부회장">부회장</option>
                  <option value="회장">회장</option>
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
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const badge = ROLE_BADGE[m.role] ?? { label: m.role, variant: "secondary" as const };
                return (
                  <tr key={m._id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 border">{m.name}</td>
                    <td className="px-3 py-2 border text-gray-500">{m.email}</td>
                    <td className="px-3 py-2 border">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>
                    <td className="px-3 py-2 border text-gray-400">
                      {new Date(m.createdAt).toLocaleDateString("ko-KR")}
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
