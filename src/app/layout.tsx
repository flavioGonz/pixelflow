import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "PixelFlow Player",
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
    themeColor: "#000000",
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
        <html lang="en">
            <body className="bg-black">
                {children}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `

              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('SW Registered with scope:', registration.scope);
                    
                    // Check for updates every 1 minute
                    setInterval(() => {
                      registration.update();
                    }, 60000);

                    // If a waiting worker exists, force it to update
                    if (registration.waiting) {
                        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }

                  }).catch(function(err) {
                    console.log('SW Registration Failed', err);
                  });

                  // Force reload when new SW takes control
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
