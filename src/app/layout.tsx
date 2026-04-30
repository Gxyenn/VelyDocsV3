import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VelyDocs - Gxyenn",
  description: "Documentasi Apikey anime sub indo free",
  keywords: ["Gxyenn", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "AI development", "React"],
  authors: [{ name: "Gxyenn" }],
  icons: {
    icon: "https://cmm63wuu800220d8vjfbs07zb.vibelandapp.com/logo.png",
  },
  openGraph: {
    title: "VelyDocs",
    description: "Documentasi api anime free sub id",
    url: "https://cmm63wuu800220d8vjfbs07zb.vibelandapp.com/",
    siteName: "VelyDocs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VelyDocs",
    description: "Documentasi api anime free sub id",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
