import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Post from "@/models/Post";
import "@/models/Project";
import PageLayout from "@/components/PageLayout";
import HomeFeed from "@/components/HomeFeed";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  await connectDB();

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // 24시간 내 Post를 작성한 authorId만 추출
  const recentAuthorIds = await Post.distinct("authorId", {
    createdAt: { $gte: oneDayAgo },
  });

  const [posts, members] = await Promise.all([
    Post.find()
      .populate("authorId", "name avatar role statusMessage portfolioSlug")
      .populate("projectId", "title type _id")
      .populate("meetingId", "_id")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
    recentAuthorIds.length > 0
      ? User.find({ _id: { $in: recentAuthorIds } })
          .select("name avatar username portfolioSlug statusMessage role")
          .lean()
      : Promise.resolve([]),
  ]);

  // 각 부원의 가장 최근 포스트 → statusMessage + 이동 링크 정보 추출
  const postStatusMap: Record<string, string> = {};
  const postLinkMap: Record<string, { category: string; projectId?: string }> = {};

  if (recentAuthorIds.length > 0) {
    const recentPostsData = await Post.find({
      authorId: { $in: recentAuthorIds },
      createdAt: { $gte: oneDayAgo },
    })
      .sort({ createdAt: -1 })
      .select("authorId postStatusMessage category projectId")
      .lean();

    for (const p of recentPostsData) {
      const key = (p.authorId as any).toString();
      if (!postLinkMap[key]) {
        postLinkMap[key] = {
          category: p.category as string,
          projectId: (p.projectId as any)?.toString(),
        };
      }
      if (!postStatusMap[key] && (p as any).postStatusMessage) {
        postStatusMap[key] = (p as any).postStatusMessage as string;
      }
    }
  }

  const membersWithPostStatus = (members as any[]).map((m) => ({
    ...m,
    postStatusMessage: postStatusMap[m._id.toString()] ?? null,
    recentPostCategory: postLinkMap[m._id.toString()]?.category ?? null,
    recentPostProjectId: postLinkMap[m._id.toString()]?.projectId ?? null,
  }));

  return (
    <PageLayout>
      <HomeFeed
        posts={JSON.parse(JSON.stringify(posts))}
        members={JSON.parse(JSON.stringify(membersWithPostStatus))}
        session={JSON.parse(JSON.stringify(session))}
      />
    </PageLayout>
  );
}
