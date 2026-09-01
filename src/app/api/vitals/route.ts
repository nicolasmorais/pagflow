import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_NAMES = new Set(["LCP", "INP", "CLS", "FCP", "TTFB"]);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, value, rating, path, visitorId } = body;

        if (!VALID_NAMES.has(name) || typeof value !== "number") {
            return NextResponse.json({ success: false }, { status: 400 });
        }

        await prisma.webVital.create({
            data: {
                name,
                value,
                rating: rating || "unknown",
                path: path || null,
                visitorId: visitorId || null,
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Vitals] Error:", error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
