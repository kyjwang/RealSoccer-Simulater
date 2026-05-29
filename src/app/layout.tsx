import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "SoccerSimulator — 2D Tactical Match Sim",
  description: "Real-player-data-driven 2D tactical football simulator with Monte Carlo predictions and historical match replay."
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
