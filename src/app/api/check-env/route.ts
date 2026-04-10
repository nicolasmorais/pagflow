import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { publicKey, accessToken } = body;

        return NextResponse.json({
            success: true,
            publicKeyMatch: process.env.NEXT_PUBLIC_MP_PUBLIC_KEY === publicKey,
            accessTokenMatch: process.env.MP_ACCESS_TOKEN === accessToken,
            actualPublicKeyPrefix: process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ? process.env.NEXT_PUBLIC_MP_PUBLIC_KEY.substring(0, 14) + '***' : "VAZIO/NÃO CARREGADO",
            actualAccessTokenPrefix: process.env.MP_ACCESS_TOKEN ? process.env.MP_ACCESS_TOKEN.substring(0, 14) + '***' : "VAZIO/NÃO CARREGADO",
        });
    } catch (e) {
        return NextResponse.json({ success: false, error: "Invalid Request" }, { status: 400 });
    }
}
