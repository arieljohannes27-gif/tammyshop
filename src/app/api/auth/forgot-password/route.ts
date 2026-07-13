import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  try {
    const { email } = schema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    // Always return success to avoid email enumeration
    if (!user) return NextResponse.json({ ok: true, message: "If that email exists, a reset link was sent." });

    const resetToken = randomBytes(24).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetExpires: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    return NextResponse.json({
      ok: true,
      message: "If that email exists, a reset link was sent.",
      // Dev convenience
      resetToken,
    });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
