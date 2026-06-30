import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Project from "@/models/Project";
import Post from "@/models/Post";
import Comment from "@/models/Comment";
import Reaction from "@/models/Reaction";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const project = await Project.findById(params.id)
    .populate("leadId", "name avatar portfolioSlug statusMessage")
    .populate("approvedBy", "name");
  if (!project) return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  await connectDB();
  const project = await Project.findById(params.id);
  if (!project) return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  const isLeadership = ["회장", "부회장"].includes(role);

  if (project.leadId.toString() !== userId && !isLeadership) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const body = await req.json();
  const memberFields = ["title", "description", "type", "progressPercentage", "startDate", "completionDate", "metadata"];
  const leaderFields = ["approvalStatus", "approvedBy"];
  const allowed = isLeadership ? [...memberFields, ...leaderFields] : memberFields;

  allowed.forEach((key) => {
    if (body[key] !== undefined) (project as any)[key] = body[key];
  });

  // 진행률에 따라 승인 상태 자동 전환 (리더십이 승인/거절한 경우는 제외)
  if (body.progressPercentage !== undefined && !body.approvalStatus) {
    const notReviewed = !["승인", "거절"].includes(project.approvalStatus);
    if (notReviewed) {
      project.approvalStatus = body.progressPercentage >= 100 ? "검토대기" : "진행중";
    }
  }

  await project.save();
  return NextResponse.json(project);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  await connectDB();
  const project = await Project.findById(params.id);
  if (!project) return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  if (project.leadId.toString() !== userId && !["회장", "부회장"].includes(role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  // 연관 Posts → Comments → Reactions cascade 삭제
  const relatedPosts = await Post.find({ projectId: params.id }).select("_id").lean();
  const postIds = relatedPosts.map((p) => p._id);
  await Promise.all([
    Post.deleteMany({ projectId: params.id }),
    Comment.deleteMany({ postId: { $in: postIds } }),
    Reaction.deleteMany({ postId: { $in: postIds } }),
  ]);

  await project.deleteOne();
  return NextResponse.json({ message: "삭제되었습니다." });
}
