import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "PixelFlow Player",
    description: "Next Generation Digital Signage",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="bg-black">{children}</body>
        </html>
    );
}
