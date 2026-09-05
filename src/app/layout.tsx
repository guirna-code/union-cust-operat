import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ChatbotWidget } from "@/components/chatbot/chatbot-widget";
import { LocaleProvider } from "@/lib/i18n";
import "./globals.css";

const arabicFont = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

const latinFont = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${arabicFont.variable} ${latinFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-cream text-ink">
        <LocaleProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <ChatbotWidget />
        </LocaleProvider>
      </body>
    </html>
  );
}
