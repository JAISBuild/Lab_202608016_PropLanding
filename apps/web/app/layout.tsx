import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./campaign.css";

export const metadata: Metadata = {
  title: {
    default: "PropLanding",
    template: "%s | PropLanding",
  },
  description: "분양·프로모션 캠페인 랜딩 플랫폼",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1a4d6d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://picsum.photos" />
        <link rel="dns-prefetch" href="https://picsum.photos" />
      </head>
      <body>{children}</body>
    </html>
  );
}
