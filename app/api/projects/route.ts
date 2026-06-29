import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Project from "@/models/Project";
import { authOptions } from "@/lib/auth";

export async function GET() {
  await connectDB();
  const projects = await Project.find()
    .populate("leadId", "name avatar portfolioSlug")
    .populate("approvedBy", "name")
    .sort({ createdAt: -1 });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { title, description, type, startDate, imageUrl } = await req.json();
  if (!title || !type) {
    return NextResponse.json({ error: "제목과 유형은 필수입니다." }, { status: 400 });
  }

  await connectDB();
  const project = await Project.create({
    title,
    description,
    type,
    startDate: startDate ? new Date(startDate) : undefined,
    imageUrl: imageUrl ?? "",
    leadId: (session.user as any).id,
    approvalStatus: "진행중",
  });

  return NextResponse.json(project, { status: 201 });
}
