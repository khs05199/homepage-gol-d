import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Project from "@/models/Project";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const APPROVAL_LABEL: Record<string, string> = {
  진행중: "진행중",
  검토대기: "검토대기",
  승인: "승인",
  거절: "거절",
};

const APPROVAL_COLOR: Record<string, string> = {
  진행중: "bg-blue-100 text-blue-800",
  검토대기: "bg-amber-100 text-amber-800",
  승인: "bg-green-100 text-green-800",
  거절: "bg-red-100 text-red-800",
};

export default async function PortfolioPage({ params }: { params: { slug: string } }) {
  await connectDB();
  const user = await User.findOne({ portfolioSlug: params.slug }).select("-passwordHash").lean() as any;
  if (!user) notFound();

  const projects = await Project.find({ leadId: user._id }).sort({ createdAt: -1 }).lean();

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <section className="mb-8 flex items-start gap-4">
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-500">
            {user.name[0]}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            {(user.role === "회장" || user.role === "부회장") && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: "linear-gradient(135deg, #D4A017 0%, #F5C518 100%)", color: "#111" }}
              >
                {user.role}
              </span>
            )}
          </div>
          {user.statusMessage && <p className="text-gray-400 mt-0.5 text-sm">{user.statusMessage}</p>}
          {user.bio && <p className="text-gray-500 mt-1">{user.bio}</p>}
          {user.skills?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {user.skills.map((s: string) => (
                <Badge key={s} variant="secondary">{s}</Badge>
              ))}
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">프로젝트 ({projects.length})</h2>
        {projects.length === 0 ? (
          <p className="text-sm text-gray-400">등록된 프로젝트가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((p: any) => {
              const status = p.approvalStatus ?? "검토대기";
              return (
                <Link key={p._id} href={`/projects/${p._id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{p.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${APPROVAL_COLOR[status]}`}>
                          {APPROVAL_LABEL[status]}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {p.description && <p className="text-sm text-gray-500 line-clamp-2">{p.description}</p>}
                      {p.type && <Badge variant="outline" className="text-xs mt-2">{p.type}</Badge>}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
