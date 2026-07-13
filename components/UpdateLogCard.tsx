import { NAVY, GOLD_GRADIENT } from "@/lib/theme";

// ── UpdateLog 배지 + 제목 + 이미지/텍스트 2단 (홈피드 · 프로젝트 타임라인 공용) ──
export default function UpdateLogCard({ post, headTitle }: { post: any; headTitle: string }) {
  return (
    <>
      <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
        <div
          className="flex items-stretch min-w-0 rounded-lg overflow-hidden"
          style={{ border: `2px solid ${NAVY}` }}
        >
          <span
            className="shrink-0 flex items-center text-sm font-bold tracking-wide px-3"
            style={{ color: "#fff", background: NAVY }}
          >
            UpdateLog
          </span>
          <h3 className="flex items-center font-bold text-lg truncate px-4" style={{ color: NAVY }}>
            {headTitle}
          </h3>
        </div>
        <p className="shrink-0 text-xs italic max-w-[45%] truncate" style={{ color: "#8a7a52" }}>
          {post.title}
        </p>
      </div>

      <div className="h-[3px] mx-6" style={{ background: GOLD_GRADIENT }} />

      <div className="grid grid-cols-2 gap-4 px-6 py-4">
        <div className="rounded-xl overflow-hidden h-56" style={{ background: "rgba(22,35,63,0.06)" }}>
          {post.imageUrl ? (
            <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: "#8a7a52" }}>
              이미지 없음
            </div>
          )}
        </div>

        <div className="rounded-xl h-56 overflow-y-auto p-4" style={{ background: "rgba(22,35,63,0.03)" }}>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>

          {post.attachments?.length > 0 && (
            <div className="mt-3 space-y-1">
              {post.attachments.map((att: any) => (
                <span key={att.url} className="text-xs text-blue-500 flex items-center gap-1">
                  📎 {att.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
