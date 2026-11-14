import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Praleisti API, Next.js vidinius ir statinius failus. "api/" su pasviruoju
  // brūkšniu: be jo praleidžiamas ir /apie (lietuviškas „Apie“) - jis likdavo be
  // kalbos ir grąžindavo 404.
  matcher: ["/((?!api/|_next|_vercel|.*\\..*).*)"],
};
