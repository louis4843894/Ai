import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";

export const metadata: Metadata = {
  title: "團購好朋友",
  description: "團購登入與訂單管理",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-Hant" className="h-full antialiased">
      <body className="min-h-full bg-[#f6f7f2] text-[#18312a]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
