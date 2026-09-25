import "./globals.css";

export const metadata = {
  title: "Route 53 Clone",
  description: "AWS Route53 style DNS management console"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
