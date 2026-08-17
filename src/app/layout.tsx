import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { APP_CONFIG } from "@/config/app";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: APP_CONFIG.name,
    template: `%s | ${APP_CONFIG.name}`,
  },
  description: APP_CONFIG.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className="bg-background text-text-primary min-h-screen antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
