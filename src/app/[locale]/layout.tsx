import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import TopBar from "@/components/TopBar";
import MobileGate from "@/components/MobileGate";
import "../globals.css";

export const metadata: Metadata = {
  title: "Medijų dienoraštis",
  description: "Asmeninė filmų, serialų, anime, dokumentikos ir žaidimų bazė",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <TopBar />
          {children}
          <MobileGate />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
