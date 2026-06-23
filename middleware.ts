export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/",
    "/projects/:path*",
    "/members/:path*",
    "/me/:path*",
    "/admin/:path*",
  ],
};
