import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Web画面構築アプリ",
  description: "ドラッグ＆ドロップでレスポンシブな Web 画面を構築するツール",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja-JP">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
