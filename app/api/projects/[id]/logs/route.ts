import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Project from "@/models/Project";
import Post from "@/models/Post";
import { authOptions } from "@/lib/auth";
import { sendPushToAll } from "@/lib/sendPush";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const logs = await Post.find({ projectId: params.id, category: "프로젝트" })
    .populate("authorId", "name avatar statusMessage")
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json(logs);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  await connectDB();
  const project = await Project.findById(params.id);
  if (!project) return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  const isLeadership = ["회장", "부회장"].includes(role);
  if (project.leadId.toString() !== userId && !isLeadership) {
    return NextResponse.json({ error: "본인 프로젝트에만 로그를 추가할 수 있습니다." }, { status: 403 });
  }

  const { title, content, imageUrl, attachments, postStatusMessage } = await req.json();
  if (!title || !content) {
    return NextResponse.json({ error: "제목과 내용은 필수입니다." }, { status: 400 });
  }
  if (!postStatusMessage?.trim()) {
    return NextResponse.json({ error: "상태 메세지는 필수입니다." }, { status: 400 });
  }

  const log = await Post.create({
    title,
    content,
    postStatusMessage: postStatusMessage.slice(0, 15),
    imageUrl: imageUrl ?? undefined,
    attachments: attachments ?? [],
    category: "프로젝트",
    projectId: params.id,
    authorId: userId,
  });

  const populated = await log.populate("authorId", "name avatar statusMessage");

  sendPushToAll({
    title: `📋 ${(populated.authorId as any)?.name ?? "누군가"}가 업데이트했습니다`,
    body: title,
    url: `/projects/${params.id}`,
  }).catch(() => {});

  return NextResponse.json(populated, { status: 201 });
}
