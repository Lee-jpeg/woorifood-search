import type { Metadata } from "next";
import "./globals.css";
import ChatbotWidget from "./components/ChatbotWidget";

export const metadata: Metadata = {
  title: "식품 트렌드 인사이트",
  description: "소스·양념류 R&D팀을 위한 식품 트렌드 대시보드",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-50">
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <a href="/" className="flex items-center gap-2">
                <span className="text-teal-600 text-xl">🍜</span>
                <span className="font-bold text-slate-900 text-sm sm:text-base">식품 트렌드 인사이트</span>
                <span className="hidden sm:inline text-xs text-slate-400 font-normal">R&D Edition</span>
              </a>
              <div className="flex items-center gap-1">
                {[
                  { href: "/", label: "대시보드" },
                  { href: "/daily", label: "데일리" },
                  { href: "/weekly", label: "위클리" },
                  { href: "/monthly", label: "먼슬리" },
                  { href: "/annual", label: "연간" },
                ].map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="px-3 py-1.5 text-sm text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
        <ChatbotWidget />
      </body>
    </html>
  );
}
