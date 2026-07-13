import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import PageLayout from "@/components/PageLayout";
import Link from "next/link";

export const dynamic = "force-dynamic";

const NAVY = "#16233F";
const GOLD_GRADIENT =
  "linear-gradient(135deg, #BF953F 0%, #FCF6BA 22%, #B38728 45%, #FBF5B7 68%, #AA771C 100%)";

export default async function MembersPage() {
  await connectDB();
  const members = await User.find().select("-passwordHash").sort({ createdAt: 1 }).lean();

  return (
    <PageLayout>
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">부원 목록</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((m: any) => (
            <Link key={m._id} href={`/profile/${m.portfolioSlug}`}>
              <div
                className="relative rounded-2xl overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                style={{ background: "#FBF3DC", border: `2px solid ${NAVY}` }}
              >
                {/* 상단 골드 배너 */}
                <div className="h-16" style={{ background: GOLD_GRADIENT }} />

                {/* 직책 배지 */}
                {(m.role && m.role !== "부원") && (
                  <span
                    className="absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: NAVY, color: "#fff" }}
                  >
                    {m.role}
                  </span>
                )}

                {/* 원형 아바타 — 배너 경계에 걸치도록 */}
                <div className="flex justify-center -mt-10">
                  {m.avatar ? (
                    <img
                      src={m.avatar}
                      alt={m.name}
                      className="w-20 h-20 rounded-full object-cover border-4 border-white"
                    />
                  ) : (
                    <div
                      className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center text-gray-900 font-black text-2xl"
                      style={{ background: "radial-gradient(circle at 30% 30%, #FFD700, #D4A700)" }}
                    >
                      {m.name[0]}
                    </div>
                  )}
                </div>

                <div className="text-center px-4 pt-3 pb-6">
                  <p className="font-bold text-lg" style={{ color: NAVY }}>{m.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5 truncate">{m.email}</p>

                  <div className="flex justify-center gap-10 mt-4">
                    <div>
                      <p className="text-xs font-medium" style={{ color: NAVY }}>나이</p>
                      <p className="font-bold text-lg" style={{ color: NAVY }}>{m.age ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: NAVY }}>재학</p>
                      <p className="font-bold text-lg" style={{ color: NAVY }}>{m.grade || "-"}</p>
                    </div>
                  </div>
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
