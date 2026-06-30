import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Project from "@/models/Project";
import Post from "@/models/Post";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";


export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  await connectDB();
  const userId = (session.user as any).id;

  const projects = await Project.find({ leadId: userId })
    .sort({ createdAt: -1 })
    .lean();

  if (projects.length === 0) return NextResponse.json([]);

  const projectIds = projects.map((p: any) => p._id);

  // 각 프로젝트에 진행상황 업데이트(Post) 존재 여부 확인
  const logs = await Post.find({
    projectId: { $in: projectIds },
    category: "프로젝트",
  })
    .select("projectId")
    .lean();

  const projectsWithLogs = new Set(logs.map((l: any) => l.projectId.toString()));

  const result = projects.map((p: any) => {
    const hasLogs = projectsWithLogs.has(p._id.toString());
    let personalStatus: "준비 중" | "진행 중" | "완료";

    if (p.approvalStatus === "승인") {
      personalStatus = "완료";
    } else if (hasLogs) {
      personalStatus = "진행 중";
    } else {
      personalStatus = "준비 중";
    }

    return { ...p, hasLogs, personalStatus };
  });

  return NextResponse.json(result);
}
