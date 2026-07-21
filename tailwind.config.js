/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            screens: {
                'portrait': { 'raw': '(max-aspect-ratio: 1/1)' },
                'landscape': { 'raw': '(min-aspect-ratio: 1/1)' },
            },
        },
    },
    plugins: [],
}
