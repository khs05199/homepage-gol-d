import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = "force-dynamic";


const MEMBERS = [
  { username: "cb.yang",        password: "261111", name: "양치복",     role: "부원" },
  { username: "jk.cho",         password: "261101", name: "조준기",     role: "부원" },
  { username: "jy.yoon",        password: "261102", name: "윤준영",     role: "부원" },
  { username: "gy.jeong",       password: "261103", name: "정가영",     role: "부원" },
  { username: "hs.kwon",        password: "260401", name: "권현석",     role: "회장" },
  { username: "jw.oh",          password: "260402", name: "오정우",     role: "부회장" },
  { username: "sh.ahn",         password: "260403", name: "안석현",     role: "부원" },
  { username: "sh.kim",         password: "260404", name: "김시현",     role: "부원" },
  { username: "jw.nam",         password: "260405", name: "남종욱",     role: "부원" },
  { username: "es.so",          password: "260406", name: "소은서",     role: "부원" },
  { username: "tumenkhuslen.b", password: "260307", name: "투멩후슬랭", role: "부원" },
  { username: "yn.ji",          password: "260308", name: "지예나",     role: "부원" },
  { username: "ks.kim",         password: "260201", name: "김교식",     role: "부원" },
  { username: "ye.kang",        password: "260101", name: "강예은",     role: "부원" },
  { username: "hw.yoo",         password: "260103", name: "유혜원",     role: "부원" },
] as const;

export async function POST() {
  await connectDB();

  const results: { username: string; name: string; action: "created" | "skipped" }[] = [];

  for (const m of MEMBERS) {
    const email = `${m.username}@gold.club`;
    const existing = await User.findOne({ $or: [{ username: m.username }, { email }] });
    if (existing) {
      results.push({ username: m.username, name: m.name, action: "skipped" });
      continue;
    }
    const passwordHash = await bcrypt.hash(m.password, 10);
    await User.create({
      name: m.name,
      email,
      passwordHash,
      role: m.role,
      username: m.username,
      portfolioSlug: m.username,
    });
    results.push({ username: m.username, name: m.name, action: "created" });
  }

  const created = results.filter((r) => r.action === "created").length;
  const skipped = results.filter((r) => r.action === "skipped").length;

  return NextResponse.json({ message: `완료: ${created}명 생성, ${skipped}명 이미 존재`, results });
}
