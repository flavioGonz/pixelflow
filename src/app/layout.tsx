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
                window.addEventListener('load', async function() {
                  try {
                    // Step 1: unregister any old SWs (only if they are NOT already pf-sw-v5)
                    const regs = await navigator.serviceWorker.getRegistrations();
                    for (const reg of regs) {
                      const url = reg.active && reg.active.scriptURL;
                      if (url && !url.endsWith('/pf-sw-v5.js')) {
                        console.log('Unregistering old SW:', url);
                        await reg.unregister();
                      }
                    }
                    // Step 2: register the new one at a STATIC url (no timestamp — otherwise every reload registers a new SW)
                    const registration = await navigator.serviceWorker.register('/pf-sw-v5.js');
                    console.log('SW Registered with scope:', registration.scope);
                    // NOTE: NO controllerchange -> reload here — that caused a reload loop.
                    // The new SW takes over on next natural navigation.
                  } catch (err) {
                    console.log('SW Registration Failed', err);
                  }
                });
              }
            `,
                    }}
                />
            </body>
        </html>
    );
}
