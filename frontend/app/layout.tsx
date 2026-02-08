import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediScan",
  description: "From ingredients to insight. See beyond the label.",
  icons: {
    icon: [{ url: "/pills.png", sizes: "any" }],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      {
        url: "/apple-touch-icon-180x180.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        url: "/apple-touch-icon-152x152.png",
        sizes: "152x152",
        type: "image/png",
      },
      {
        url: "/apple-touch-icon-144x144.png",
        sizes: "144x144",
        type: "image/png",
      },
      {
        url: "/apple-touch-icon-120x120.png",
        sizes: "120x120",
        type: "image/png",
      },
      {
        url: "/apple-touch-icon-114x114.png",
        sizes: "114x114",
        type: "image/png",
      },
      { url: "/apple-touch-icon-76x76.png", sizes: "76x76", type: "image/png" },
      { url: "/apple-touch-icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/apple-touch-icon-60x60.png", sizes: "60x60", type: "image/png" },
      { url: "/apple-touch-icon-57x57.png", sizes: "57x57", type: "image/png" },
      {
        url: "/apple-touch-icon-precomposed.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
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
