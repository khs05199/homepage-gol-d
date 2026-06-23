import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import PageLayout from "@/components/PageLayout";
import Link from "next/link";


export default async function MembersPage() {
  await connectDB();
  const members = await User.find().select("-passwordHash").sort({ createdAt: 1 }).lean();

  return (
    <PageLayout>
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">부원 목록</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m: any) => (
            <Link key={m._id} href={`/profile/${m.portfolioSlug}`}>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all cursor-pointer flex items-center gap-4">
                {m.avatar ? (
                  <img
                    src={m.avatar}
                    alt={m.name}
                    className="w-12 h-12 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-gray-900 font-bold text-lg shrink-0"
                    style={{ background: "linear-gradient(135deg, #D4A017 0%, #F5C518 100%)" }}
                  >
                    {m.name[0]}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-gray-900 text-sm truncate">{m.name}</p>
                    {(m.role === "회장" || m.role === "부회장") && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0"
                        style={{ background: "linear-gradient(135deg, #D4A017 0%, #F5C518 100%)", color: "#111" }}
                      >
                        {m.role}
                      </span>
                    )}
                  </div>
                  {m.statusMessage && (
                    <p className="text-xs text-gray-400 truncate">{m.statusMessage}</p>
                  )}
                  {!m.statusMessage && m.bio && (
                    <p className="text-xs text-gray-400 truncate">{m.bio}</p>
                  )}
                  {m.skills?.length > 0 && (
                    <p className="text-xs text-gray-300 truncate mt-0.5">{m.skills.join(" · ")}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {members.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-20">부원이 없습니다.</p>
        )}
      </main>
    </PageLayout>
  );
}
