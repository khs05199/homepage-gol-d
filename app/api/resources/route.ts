import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Resource from "@/models/Resource";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  await connectDB();
  const folder = req.nextUrl.searchParams.get("folder");
  const query = folder ? { folder } : {};
  const items = await Resource.find(query)
    .populate("authorId", "name username")
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const { folder, title, content, imageUrls, attachments, links, tags } = body;

  if (!folder || !title)
    return NextResponse.json({ error: "폴더와 제목은 필수입니다." }, { status: 400 });

  const item = await Resource.create({
    folder,
    title,
    content: content ?? "",
    imageUrls: imageUrls ?? [],
    attachments: attachments ?? [],
    links: links ?? [],
    tags: tags ?? [],
    authorId: (session.user as any).id,
  });

  const populated = await item.populate("authorId", "name username");
  return NextResponse.json(populated, { status: 201 });
}
