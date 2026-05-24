import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Praleisti API, Next.js vidinius ir statinius failus
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
