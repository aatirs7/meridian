import type { ReactNode } from "react";

export const metadata = {
  title: "Meridian API",
  description: "Backend for Meridian.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
