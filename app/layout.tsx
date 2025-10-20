import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ad Intelligence - Marketing Analytics Platform",
  description: "Analyze ad creatives and discover what drives performance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
