import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const isAdmin = request.nextUrl.pathname.startsWith('/admin')
    if (!isAdmin) return NextResponse.next()

    const auth = request.cookies.get('admin_auth')?.value
    if (auth !== 'authenticated') {
        return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
}

export const config = {
    matcher: ['/admin/:path*'],
}
