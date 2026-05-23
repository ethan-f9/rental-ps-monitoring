import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PS Rental Control Room",
  description: "Industrial dashboard for billing, packages, units, menu, and rental logs"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
