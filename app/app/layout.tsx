import type { Metadata } from "next";
import { MiniKitProvider } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Masil - Verified Neighborhood Reviews",
  description: "GPS-verified, World ID-authenticated reviews for foreigners in Korea",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <MiniKitProvider>{children}</MiniKitProvider>
      </body>
    </html>
  );
}
