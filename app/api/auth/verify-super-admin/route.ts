import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { code?: unknown };
    const submitted = typeof body.code === "string" ? body.code : "";
    const expected = process.env.SUPER_ADMIN_CODE ?? "";
    const submittedBuffer = Buffer.from(submitted);
    const expectedBuffer = Buffer.from(expected);
    const valid = expected.length > 0 && submittedBuffer.length === expectedBuffer.length && timingSafeEqual(submittedBuffer, expectedBuffer);
    return NextResponse.json({ valid }, { status: valid ? 200 : 401 });
  } catch {
    return NextResponse.json({ valid: false }, { status: 400 });
  }
}
