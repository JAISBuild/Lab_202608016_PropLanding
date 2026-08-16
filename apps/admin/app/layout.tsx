import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PropLanding Control Tower",
  description: "캠페인·문의 운영 콘솔",
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
