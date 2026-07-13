import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Project from "@/models/Project";
import Post from "@/models/Post";
import Comment from "@/models/Comment";
import PageLayout from "@/components/PageLayout";
import ProjectDetail from "@/components/ProjectDetail";
import ThesisProjectDetail from "@/components/ThesisProjectDetail";

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

  const currentUser = session
    ? { id: (session.user as any).id, role: (session.user as any).role }
    : null;

  // 논문 프로젝트는 새로운 리모델링 디자인(ThesisProjectDetail) 사용.
  // 개발/공모전은 각자 전용 페이지가 준비될 때까지 기존 디자인을 그대로 유지.
  if ((project as any).type === "논문") {
    return (
      <PageLayout>
        <ThesisProjectDetail
          project={JSON.parse(JSON.stringify(project))}
          logs={JSON.parse(JSON.stringify(logs))}
          currentUser={currentUser}
        />
      </PageLayout>
    );
  }

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
        currentUser={currentUser}
      />
    </PageLayout>
  );
}
