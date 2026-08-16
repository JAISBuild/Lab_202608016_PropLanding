import type { Metadata } from "next";
import "./globals.css";
import "./campaign.css";

export const metadata: Metadata = {
  title: "PropLanding",
  description: "분양·프로모션 캠페인 랜딩 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
