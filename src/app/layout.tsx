import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider, ThemeScript } from "@/components/theme/ThemeProvider";

export const metadata: Metadata = {
    title: "PixelFlow Studio",
    description: "Next Generation Digital Signage Platform",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "PixelFlow",
    },
    formatDetection: {
        telephone: false,
    },
};

export const viewport = {
    themeColor: "#fafafa",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" suppressHydrationWarning>
            <head>
                <ThemeScript defaultMode="light" />
            </head>
            <body>
                <ThemeProvider defaultMode="light">
                    {children}
                </ThemeProvider>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('SW Registered with scope:', registration.scope);
                    setInterval(() => { registration.update(); }, 60000);
                    if (registration.waiting) {
                        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }
                  }).catch(function(err) {
                    console.log('SW Registration Failed', err);
                  });
                  let refreshing = false;
                  navigator.serviceWorker.addEventListener('controllerchange', () => {
                    if (!refreshing) {
                      window.location.reload();
                      refreshing = true;
                    }
                  });
                });
              }
            `,
                    }}
                />
            </body>
        </html>
    );
}
