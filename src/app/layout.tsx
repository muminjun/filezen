import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'FileZen — All-in-One Image, PDF & File Converter',
    template: '%s | FileZen',
  },
  description: 'Convert, edit and process files instantly in your browser. No uploads. Image conversion, PDF editing, photo frames, GIF, OCR, AI upscale & more.',
  metadataBase: new URL('https://filezen.app'),
  icons: {
    icon: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/logo.svg`,
    apple: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/logo.svg`,
  },
};

export const viewport: Viewport = {
  viewportFit: 'cover',
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistMono.variable} h-dvh antialiased`}
      style={{ fontFamily: "'SUIT Variable', -apple-system, BlinkMacSystemFont, sans-serif" }}
      suppressHydrationWarning
    >
      <body className="h-full overflow-hidden flex flex-col">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
