import { getServerAuthSession } from "@/lib/auth";
import Navbar from "@/components/navbar";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/login");
  }

  const role = session.user?.role;
  let content;

  if (role === "employee") {
    // Hitung kehadiran employee ini
    const hadir = await prisma.absensi.count({
      where: { userId: session.user?.id, status: "hadir" },
    });

    const tidakHadir = await prisma.absensi.count({
      where: { userId: session.user?.id, status: "tidak_hadir" },
    });

    const total = hadir + tidakHadir;
    const persentase = total > 0 ? ((hadir / total) * 100).toFixed(2) : 0;

    content = (
      <div className="max-w-lg mx-auto mt-8 bg-white p-6 rounded-2xl shadow">
        <h2 className="text-2xl font-semibold text-gray-800 text-center">
          Welcome, {session.user?.name} 👋
        </h2>

        <div className="mt-6 space-y-3">
          <div className="flex justify-between p-3 border rounded-lg">
            <span>📅 Hadir</span>
            <span className="font-medium">{hadir} hari</span>
          </div>
          <div className="flex justify-between p-3 border rounded-lg">
            <span>❌ Tidak Hadir</span>
            <span className="font-medium">{tidakHadir} hari</span>
          </div>
          <div className="flex justify-between p-3 border rounded-lg">
            <span>✅ Persentase Kehadiran</span>
            <span className="font-medium">{persentase}%</span>
          </div>
        </div>
      </div>
    );
  } else if (role === "admin") {
    const employees = await prisma.user.findMany({
      where: { role: "employee" },
      select: { id: true, name: true, email: true },
    });

    content = (
      <div className="max-w-2xl mx-auto mt-8 bg-white p-6 rounded-2xl shadow">
        <h2 className="text-2xl font-semibold text-gray-800">
          Admin Dashboard
        </h2>
        <h3 className="mt-4 text-lg font-medium">📋 List Employee</h3>
        <ul className="mt-4 space-y-3">
          {employees.map((emp) => (
            <li
              key={emp.id}
              className="p-4 bg-gray-50 border rounded-lg shadow-sm"
            >
              <p className="font-medium">{emp.name}</p>
              <p className="text-sm text-gray-600">{emp.email}</p>
            </li>
          ))}
        </ul>
      </div>
    );
  } else {
    content = <p className="text-center mt-8">Role tidak dikenali</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="p-6">{content}</main>
    </div>
  );
}
