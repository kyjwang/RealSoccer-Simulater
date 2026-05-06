import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "RealBall Sim",
  description: "Real-player-data-driven 2D tactical football simulator MVP"
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
