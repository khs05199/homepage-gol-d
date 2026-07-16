import { connectDB } from "@/lib/mongodb";
import Project from "@/models/Project";
import "@/models/User";
import PageLayout from "@/components/PageLayout";

export const dynamic = "force-dynamic";
import Link from "next/link";

const APPROVAL_LABEL: Record<string, string> = {
  진행중: "진행중",
  검토대기: "검토대기",
  승인: "승인",
  거절: "거절",
};

const APPROVAL_COLOR: Record<string, string> = {
  진행중: "bg-blue-400/15 text-blue-600",
  검토대기: "bg-amber-400/15 text-amber-600",
  승인: "bg-emerald-400/15 text-emerald-600",
  거절: "bg-red-400/15 text-red-600",
};

export default async function ProjectsPage() {
  await connectDB();
  const projects = await Project.find()
    .populate("leadId", "name portfolioSlug avatar")
    .sort({ createdAt: -1 })
    .lean();

  return (
    <PageLayout>
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">전체 프로젝트</h1>
          <Link
            href="/projects/new"
            className="text-sm px-5 py-2.5 rounded-full font-semibold text-gray-900 hover:opacity-90 transition-all"
            style={{ background: "linear-gradient(135deg, #D4A017 0%, #F5C518 100%)" }}
          >
            + 새 프로젝트
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p: any) => {
            const status = p.approvalStatus ?? "검토대기";
            return (
              <Link key={p._id} href={`/projects/${p._id}`}>
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all cursor-pointer h-full flex flex-col">
                  <div
                    className="w-full h-44 flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #1a1f2e 0%, #0f1117 100%)" }}
                  >
                    <span className="text-3xl font-black gold-text">{p.title[0]}</span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{p.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 font-medium ${APPROVAL_COLOR[status]}`}>
                        {APPROVAL_LABEL[status]}
                      </span>
                    </div>
                    {p.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{p.description}</p>
                    )}
                    {p.progressPercentage > 0 && (
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${p.progressPercentage}%`,
                            background: "linear-gradient(90deg, #D4A017, #F5C518)",
                          }}
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-400 mt-auto pt-2">
                      <span>{(p.leadId as any)?.name}</span>
                      <span>{new Date(p.createdAt).toLocaleDateString("ko-KR")}</span>
                    </div>
                    {p.type && (
                      <span className="inline-block text-xs px-2.5 py-1 rounded-full border border-yellow-200 text-yellow-700 bg-yellow-50 font-medium w-fit">
                        {p.type}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-20 text-gray-400 text-sm">
            아직 등록된 프로젝트가 없습니다.
          </div>
        )}
      </main>
    </PageLayout>
  );
}
