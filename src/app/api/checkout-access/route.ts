import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, source, medium, campaign, term, content } = body;

    const p = prisma as any;
    const newId = require('crypto').randomUUID();
    
    await p.$executeRaw`INSERT INTO "CheckoutAccess" (id, "productId", source, medium, campaign, term, content, "createdAt") VALUES (${newId}, ${productId || null}, ${source || null}, ${medium || null}, ${campaign || null}, ${term || null}, ${content || null}, NOW())`;

    return NextResponse.json({ success: true, accessId: newId });
  } catch (error: any) {
    console.error("Checkout Access Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch(e) {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
  
  const { accessId, step } = body;

  if (!accessId) {
    return NextResponse.json({ success: false, error: "accessId required" }, { status: 400 });
  }

  let column: string;
  switch (step) {
    case 1: column = 'step1Completed'; break;
    case 2: column = 'step2Completed'; break;
    case 3: column = 'step3Completed'; break;
    case 'payment': column = 'paymentCompleted'; break;
    default: return NextResponse.json({ success: false, error: "invalid step" }, { status: 400 });
  }

  try {
    const p = prisma as any;
    
    // Try direct SQL update
    await p.$executeRawUnsafe(`UPDATE "CheckoutAccess" SET "${column}" = true WHERE id = '${accessId}'`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Checkout Update Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
