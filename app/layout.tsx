import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { Nav } from "@/components/layout/nav";
import { NotificationProvider } from "@/components/notifications/notification-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "L.I.G.T.A.S. — Disaster Response Hub",
  description: "Logistics Integration & Geo-Targeted Allocation System. Real-time disaster resource coordination for Filipino communities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50">
        <AuthProvider>
          <NotificationProvider>
            <Nav />
            <div className="flex flex-1 flex-col">{children}</div>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
