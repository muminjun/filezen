import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FileZen - Image Converter",
  description: "Convert and resize images instantly. Client-side processing, no uploads.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistMono.variable} h-full antialiased`}
      style={{ fontFamily: "'SUIT', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
