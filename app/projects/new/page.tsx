"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/PageLayout";

export default function NewProjectPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "개발",
    startDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "오류가 발생했습니다.");
      return;
    }
    const project = await res.json();
    router.push(`/projects/${project._id}`);
  }

  const inputClass =
    "w-full px-4 py-3.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-300 text-sm focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition-all";

  return (
    <PageLayout>
      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">새 프로젝트</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              프로젝트 이름 <span className="text-yellow-500">*</span>
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="어떤 프로젝트인가요?"
              className={inputClass}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              프로젝트 설명
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="프로젝트에 대해 자세히 설명해주세요. 목표, 사용 기술, 기대 효과 등을 작성하면 좋아요."
              rows={6}
              className={`${inputClass} resize-none leading-relaxed`}
            />
          </div>

          {/* Type + Start date row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                유형 <span className="text-yellow-500">*</span>
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className={`${inputClass} bg-white`}
              >
                <option value="개발">개발</option>
                <option value="논문">논문</option>
                <option value="공모전">공모전</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                시작일
              </label>
              <input
                name="startDate"
                type="date"
                value={form.startDate}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-gray-900 text-sm disabled:opacity-60 transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #D4A017 0%, #F5C518 100%)" }}
          >
            {loading ? "생성 중..." : "프로젝트 만들기"}
          </button>
        </form>
      </main>
    </PageLayout>
  );
}
