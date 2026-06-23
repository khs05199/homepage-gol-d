"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import PageLayout from "@/components/PageLayout";

export default function EditProjectPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "개발",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then((p) => {
        setForm({
          title: p.title,
          description: p.description ?? "",
          type: p.type ?? "개발",
        });
      });
  }, [id]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    router.push(`/projects/${id}`);
  }

  const inputClass =
    "w-full px-4 py-3.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-300 text-sm focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition-all";

  return (
    <PageLayout>
      <main className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">프로젝트 수정</h1>

        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">프로젝트 이름</label>
              <input name="title" value={form.title} onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">설명</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                className={`${inputClass} resize-none leading-relaxed`}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">유형</label>
              <select name="type" value={form.type} onChange={handleChange} className={`${inputClass} bg-white`}>
                <option value="개발">개발</option>
                <option value="논문">논문</option>
                <option value="공모전">공모전</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-gray-900 text-sm disabled:opacity-60 transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #D4A017 0%, #F5C518 100%)" }}
            >
              {loading ? "저장 중..." : "저장"}
            </button>
          </form>
        </div>
      </main>
    </PageLayout>
  );
}
