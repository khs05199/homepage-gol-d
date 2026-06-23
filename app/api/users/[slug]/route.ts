import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Project from "@/models/Project";

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  await connectDB();
  const user = await User.findOne({ portfolioSlug: params.slug }).select("-passwordHash");
  if (!user) return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });

  const projects = await Project.find({ leadId: user._id }).sort({ createdAt: -1 });
  return NextResponse.json({ user, projects });
}
