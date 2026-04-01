import type { Metadata } from "next";
import { Manrope, Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "Fastify-API | Technical Curator",
  description: "API Management Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#b0c6ff",
          colorBackground: "#0b1326",
          colorInputBackground: "#222a3d",
          colorText: "#dae2fd",
          colorTextOnPrimaryBackground: "#002d6e",
        },
      }}
    >
      <html lang="en" className={`${manrope.variable} ${inter.variable} ${jetbrains.variable} dark`}>
        <head>
          <link
            href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="min-h-screen bg-surface text-on-surface">
          <Sidebar />
          <TopNav />
          <main className="ml-64 pt-24 px-8 pb-12 min-h-screen">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
