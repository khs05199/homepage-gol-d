import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Resource from "@/models/Resource";
import { authOptions } from "@/lib/auth";
import { isLeadership } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  await connectDB();
  const item = await Resource.findById(params.id);
  if (!item) return NextResponse.json({ error: "없는 자료입니다." }, { status: 404 });

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  if (item.authorId.toString() !== userId && !isLeadership(role))
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  await item.deleteOne();
  return NextResponse.json({ message: "삭제되었습니다." });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  await connectDB();
  const item = await Resource.findById(params.id);
  if (!item) return NextResponse.json({ error: "없는 자료입니다." }, { status: 404 });

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  if (item.authorId.toString() !== userId && !isLeadership(role))
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const body = await req.json();
  const allowed = ["title", "content", "imageUrls", "attachments", "links", "tags"];
  allowed.forEach((k) => { if (body[k] !== undefined) (item as any)[k] = body[k]; });
  item.updatedAt = new Date();
  await item.save();

  const populated = await item.populate("authorId", "name username");
  return NextResponse.json(populated);
}
