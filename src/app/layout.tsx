import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Save with Jenny | Premium Cooperative & Thrift Platform",
  description: "Modern rotating savings and contribution platform for digital cooperatives. Secure, transparent, and automated.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
