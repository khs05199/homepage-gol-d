import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Project from "@/models/Project";
import Post from "@/models/Post";
import Comment from "@/models/Comment";
import PageLayout from "@/components/PageLayout";
import ProjectDetail from "@/components/ProjectDetail";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  await connectDB();

  const project = await Project.findById(params.id)
    .populate("leadId", "name avatar portfolioSlug statusMessage")
    .populate("approvedBy", "name")
    .lean();

  if (!project) notFound();

  const logs = await Post.find({ projectId: params.id, category: "프로젝트" })
    .populate("authorId", "name avatar statusMessage")
    .sort({ createdAt: -1 })
    .lean();

  const postIds = logs.map((l: any) => l._id);
  const comments = await Comment.find({ postId: { $in: postIds } })
    .populate("userId", "name avatar portfolioSlug")
    .sort({ createdAt: 1 })
    .lean();

  return (
    <PageLayout>
      <ProjectDetail
        project={JSON.parse(JSON.stringify(project))}
        logs={JSON.parse(JSON.stringify(logs))}
        comments={JSON.parse(JSON.stringify(comments))}
        currentUser={
          session ? { id: (session.user as any).id, role: (session.user as any).role } : null
        }
      />
    </PageLayout>
  );
}
