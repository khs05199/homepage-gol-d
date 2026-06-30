import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isLeadership } from "@/lib/roles";
import PageLayout from "@/components/PageLayout";
import AdminDashboard from "@/components/AdminDashboard";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Post from "@/models/Post";

export const dynamic = "force-dynamic";


export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || !isLeadership(role)) redirect("/");

  await connectDB();
  const [members, announcements] = await Promise.all([
    User.find().select("-passwordHash").sort({ createdAt: 1 }).lean(),
    Post.find({ category: "공지" }).populate("authorId", "name").sort({ createdAt: -1 }).lean(),
  ]);

  return (
    <PageLayout>
      <AdminDashboard
        members={JSON.parse(JSON.stringify(members))}
        announcements={JSON.parse(JSON.stringify(announcements))}
      />
    </PageLayout>
  );
}
