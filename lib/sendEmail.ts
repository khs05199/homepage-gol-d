import nodemailer from "nodemailer";
import { connectDB } from "./mongodb";
import User from "@/models/User";

type EmailPayload = {
  subject: string;
  authorName: string;
  title: string;
  content?: string;
  url: string;
};

export async function sendEmailToAll(payload: EmailPayload) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("[sendEmail] GMAIL_USER 또는 GMAIL_APP_PASSWORD 미설정 — 건너뜀");
    return;
  }

  try {
    await connectDB();
    const users = await User.find({}).select("email").lean();
    const emails = (users as any[])
      .map((u) => u.email as string | undefined)
      .filter((e): e is string => Boolean(e));

    if (emails.length === 0) return;

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const siteUrl = process.env.NEXTAUTH_URL ?? "";
    const fullUrl = payload.url.startsWith("http")
      ? payload.url
      : `${siteUrl}${payload.url}`;

    await transporter.sendMail({
      from: `"GOL:D 동아리" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      bcc: emails,
      subject: payload.subject,
      html: buildEmailHtml({ ...payload, fullUrl }),
    });

    console.log(`[sendEmail] ${emails.length}명 BCC 발송 완료`);
  } catch (err) {
    console.error("[sendEmail] 발송 실패:", err);
  }
}

function buildEmailHtml({
  authorName,
  title,
  content,
  fullUrl,
}: EmailPayload & { fullUrl: string }) {
  const preview = content
    ? content.replace(/<[^>]+>/g, "").slice(0, 120)
    : "";
  const hasMore = content ? content.replace(/<[^>]+>/g, "").length > 120 : false;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0a0c12;font-family:-apple-system,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 16px;">
    <div style="text-align:center;padding-bottom:24px;">
      <span style="font-size:36px;font-weight:900;color:#F5C518;letter-spacing:-1px;">GOL:D</span>
      <p style="margin:4px 0 0;font-size:11px;color:#666;letter-spacing:2px;">AI &middot; BIGDATA CLUB</p>
    </div>
    <div style="background:#14161f;border:1.5px solid rgba(212,160,23,0.4);border-radius:16px;padding:28px;">
      <p style="margin:0 0 6px;font-size:12px;color:#888;">
        <strong style="color:#F5C518;">${authorName}</strong>님이 새 게시물을 올렸습니다
      </p>
      <h2 style="margin:0 0 14px;font-size:18px;color:#fff;line-height:1.4;font-weight:700;">
        ${title}
      </h2>
      ${preview ? `<p style="margin:0 0 22px;font-size:14px;color:#aaa;line-height:1.7;">${preview}${hasMore ? "&hellip;" : ""}</p>` : ""}
      <a href="${fullUrl}"
         style="display:inline-block;background:linear-gradient(135deg,#D4A017,#F5C518);color:#111;font-weight:700;font-size:14px;text-decoration:none;padding:12px 26px;border-radius:10px;">
        확인하러 가기 &rarr;
      </a>
    </div>
    <p style="text-align:center;margin:20px 0 0;font-size:11px;color:#444;">
      GOL:D 동아리 홈페이지 자동 알림 메일입니다
    </p>
  </div>
</body>
</html>`;
}
