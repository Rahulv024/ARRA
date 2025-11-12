import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const isAdmin = req.nextUrl.pathname.startsWith("/admin");
      if (!isAdmin) return true;
      return token?.role === "ADMIN";
    },
  },
});

export const config = { matcher: ["/admin/:path*"] };
