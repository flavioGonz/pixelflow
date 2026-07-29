import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Check if the user is accessing a protected route
    if (request.nextUrl.pathname.startsWith('/admin')) {
        const token = request.cookies.get('token');

        if (!token) {
            // Redirect to login page if no token is found
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // If accessing login page while already authenticated, redirect to admin
    if (request.nextUrl.pathname === ('/login')) {
        const token = request.cookies.get('token');
        if (token) {
            return NextResponse.redirect(new URL('/admin', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/login'],
};
