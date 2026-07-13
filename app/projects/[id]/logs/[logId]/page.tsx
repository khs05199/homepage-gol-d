import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Project from "@/models/Project";
import Post from "@/models/Post";
import Comment from "@/models/Comment";
import PageLayout from "@/components/PageLayout";
import LogDetail from "@/components/LogDetail";

export const dynamic = "force-dynamic";

export default async function LogDetailPage({ params }: { params: { id: string; logId: string } }) {
  const session = await getServerSession(authOptions);
  await connectDB();

  const project = await Project.findById(params.id).lean();
  if (!project) notFound();

  const post = await Post.findOne({ _id: params.logId, projectId: params.id, category: "프로젝트" })
    .populate("authorId", "name avatar role")
    .lean();
  if (!post) notFound();

  const comments = await Comment.find({ postId: params.logId })
    .populate("userId", "name avatar portfolioSlug username")
    .sort({ createdAt: 1 })
    .lean();

  return (
    <PageLayout>
      <LogDetail
        project={JSON.parse(JSON.stringify(project))}
        post={JSON.parse(JSON.stringify(post))}
        initialComments={JSON.parse(JSON.stringify(comments))}
        currentUser={
          session ? { id: (session.user as any).id, role: (session.user as any).role } : null
        }
      />
    </PageLayout>
  );
}
