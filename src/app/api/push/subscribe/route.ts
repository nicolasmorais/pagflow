import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    // Web Push desativado - Usar apenas Native Push
    return NextResponse.json({ error: "Web Push desativado. Use Native Push." }, { status: 410 });
}

