import { NextResponse } from "next/server";
import { gameRegistry } from "@/games";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: gameRegistry.getMetadata(),
  });
}
