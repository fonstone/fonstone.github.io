import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ConsoleProvider from "@/components/Console";

const isVercel = process.env.VERCEL === "1";

async function AnalyticsWrapper() {
  if (!isVercel) return null;
  const { Analytics } = await import("@vercel/analytics/next");
  return <Analytics />;
}

// Initialize Gilroy font
const gilroy = localFont({
  src: [
    {
      path: '../../public/fonts/Gilroy-Light.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Gilroy-LightItalic.ttf',
      weight: '300',
      style: 'italic',
    },
    {
      path: '../../public/fonts/Gilroy-Medium.ttf',    
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Gilroy-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-gilroy',
  display: 'swap',
});
export const metadata: Metadata = {
  title: "StoneFon | Personal Portfolio",
  description: "A modern and minimalist portfolio showcasing my work, skills, and experiences in web development and design.",
  keywords: ["portfolio", "web development", "design", "projects", "skills"],
  authors: [{ name: "Wafastarz (Muhammad Khoirul Wafa)" }],
  creator: "Wafastarz (Muhammad Khoirul Wafa)",
  publisher: "Wafastarz (Muhammad Khoirul Wafa)",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    title: "StoneFon | Personal Portfolio",
    description: "A modern and minimalist portfolio showcasing my work, skills, and experiences in web development and design.",
    siteName: "StoneFon",
  },
  twitter: {
    card: "summary_large_image",
    title: "StoneFon | Personal Portfolio",
    description: "A modern and minimalist portfolio showcasing my work, skills, and experiences in web development and design.",
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${gilroy.variable} font-gilroy antialiased`}>
        <ConsoleProvider />
        {children}
        <AnalyticsWrapper />
      </body>
    </html>
  );
}
