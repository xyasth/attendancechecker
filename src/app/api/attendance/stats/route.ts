import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hadir = await prisma.absensi.count({
    where: { userId: session.user.id, status: "hadir" },
  });

  const tidakHadir = await prisma.absensi.count({
    where: { userId: session.user.id, status: "tidak_hadir" },
  });

  const total = hadir + tidakHadir;
  const persentase = total > 0 ? ((hadir / total) * 100).toFixed(2) : "0";

  return NextResponse.json({ hadir, tidakHadir, persentase });
}