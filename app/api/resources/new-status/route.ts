import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Resource, { RESOURCE_FOLDERS } from "@/models/Resource";

export const dynamic = "force-dynamic";


export async function GET() {
  await connectDB();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // 폴더별 최근 7일 내 업데이트 여부
  const recentFolders = await Resource.distinct("folder", {
    createdAt: { $gte: sevenDaysAgo },
  });

  const hasAnyNew = recentFolders.length > 0;
  const newFolders = RESOURCE_FOLDERS.filter((f) => recentFolders.includes(f));

  return NextResponse.json({ hasAnyNew, newFolders });
}
