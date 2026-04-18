import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const { token, platform } = await req.json();
        console.log(`[NativePush] Registration received. Platform: ${platform}, Token prefix: ${token?.slice(0, 30)}...`);

        if (!token) {
            return NextResponse.json({ error: "Token inválido" }, { status: 400 });
        }

        // Armazenamos o token no modelo de PushSubscription usando campos dummy
        // para p256dh e auth, marcando como native
        await prisma.pushSubscription.upsert({
            where: { endpoint: token },
            update: {
                p256dh: `native-${platform}`,
                auth: 'capacitor',
            },
            create: {
                endpoint: token,
                p256dh: `native-${platform}`,
                auth: 'capacitor',
            }
        });

        console.log(`[NativePush] Token saved successfully.`);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving native push token:", error);
        return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
    }
}
