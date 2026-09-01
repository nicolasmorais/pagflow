import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { visitorId, step, productId, orderId, clickId, utmSource, utmMedium, utmCampaign, utmTerm, utmContent } = body;

        if (!visitorId || !step) {
            return NextResponse.json({ success: false }, { status: 400 });
        }

        await prisma.checkoutEvent.create({
            data: {
                visitorId: String(visitorId),
                step: String(step),
                productId: productId || null,
                orderId: orderId || null,
                clickId: clickId || null,
                utmSource: utmSource || null,
                utmMedium: utmMedium || null,
                utmCampaign: utmCampaign || null,
                utmTerm: utmTerm || null,
                utmContent: utmContent || null,
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Track] Error:", error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
