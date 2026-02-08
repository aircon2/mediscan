import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediScan",
  description: "From ingredients to insight. See beyond the label.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ background: "#eff6ff" }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Space+Grotesk:wght@300..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased font-sans bg-gradient-to-b from-blue-50 to-purple-50">
        {children}
      </body>
    </html>
  );
}
