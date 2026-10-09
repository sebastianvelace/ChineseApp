import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { RegisterSW } from "@/components/RegisterSW";
import { Shell } from "@/components/Shell";
import { ProgressProvider } from "@/lib/progress";
import "./globals.css";

const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });

export const metadata: Metadata = {
  title: "Hanlu",
  description: "Learn Chinese, one step at a time.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full">
        <ProgressProvider>
          <RegisterSW />
          <Shell>{children}</Shell>
        </ProgressProvider>
      </body>
    </html>
  );
}
