import type { Metadata } from "next";
import "./globals.css";
import "./art.css";
export const metadata: Metadata = { title: "Realest Reset Logistics", description: "Reliable same-day, freight, and final-mile delivery solutions for businesses." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
