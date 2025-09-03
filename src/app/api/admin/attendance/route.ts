// src/app/api/admin/attendance/route.ts
import { NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const employees = await prisma.user.findMany({
      where: { role: "employee" },
      include: {
        absensi: {
          where: { date: { gte: today } },
        },
      },
    });

    const result = employees.map((emp) => ({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      attended: emp.absensi.length > 0,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
