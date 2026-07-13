import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({ token: z.string().min(10) });

export async function POST(req: Request) {
  try {
    const { token } = schema.parse(await req.json());
    const user = await prisma.user.findFirst({ where: { verifyToken: token } });
    if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 400 });

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verifyToken: null },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
