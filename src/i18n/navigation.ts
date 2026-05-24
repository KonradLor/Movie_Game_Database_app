import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Kalbas suvokiantys navigacijos pagalbininkai
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
