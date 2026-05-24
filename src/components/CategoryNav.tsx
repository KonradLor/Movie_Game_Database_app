import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const CATS = [
  { key: "all", value: "" },
  { key: "movies", value: "MOVIE" },
  { key: "series", value: "SERIES" },
  { key: "anime", value: "ANIME" },
  { key: "documentaries", value: "DOCUMENTARY" },
  { key: "games", value: "GAME" },
] as const;

export default async function CategoryNav({
  active,
  q,
}: {
  active: string; // "" reiskia visi
  q?: string;
}) {
  const t = await getTranslations();

  function href(value: string) {
    const params = new URLSearchParams();
    if (value) params.set("cat", value);
    if (q) params.set("q", q);
    const s = params.toString();
    return s ? `/?${s}` : "/";
  }

  return (
    <nav className="flex flex-wrap gap-2">
      {CATS.map((c) => {
        const isActive = active === c.value;
        return (
          <Link
            key={c.key}
            href={href(c.value)}
            className={`glass px-4 py-1.5 text-sm transition hover:text-white ${
              isActive ? "chip-active" : "text-white/70"
            }`}
          >
            {t(`nav.${c.key}`)}
          </Link>
        );
      })}
    </nav>
  );
}
