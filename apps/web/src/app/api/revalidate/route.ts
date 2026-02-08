import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-revalidation-token");

  if (!process.env.REVALIDATION_TOKEN) {
    return NextResponse.json({ error: "REVALIDATION_TOKEN is not configured" }, { status: 500 });
  }

  if (token !== process.env.REVALIDATION_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidatePath("/", "layout");

  return NextResponse.json({ revalidated: true, timestamp: new Date().toISOString() });
}
