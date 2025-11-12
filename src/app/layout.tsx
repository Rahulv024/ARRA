import "./globals.css";
import { ReactNode } from "react";
import ThemeProvider from "@/components/theme/ThemeProvider";
import AuthSessionProvider from "@/components/providers/SessionProvider";
import QueryProvider from "@/components/providers/QueryProvider";
import Header from "@/components/layout/Header";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased flex flex-col">
        <ThemeProvider>
          <AuthSessionProvider>
            <QueryProvider>
              <Header />
              <main className="mesh flex-1">{children}</main>
              <footer className="border-t">
                <div className="max-w-7xl mx-auto px-4 py-6 text-sm text-zinc-500">
                  © {new Date().getFullYear()} Recipe Finder
                </div>
              </footer>
            </QueryProvider>
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

