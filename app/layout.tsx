import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart AI Financial Assistant & Deal Finder",
  description:
    "Intelligent personal finance manager that tracks digital and cash expenses, visualizes monthly income, dynamically reallocates budgets upon overspending, ingests bank statements, and uses Google Gemini AI to recommend localized shopping coupons.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
