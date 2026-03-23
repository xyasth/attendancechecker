"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<{ hadir: number; tidakHadir: number; persentase: string } | null>(null);
  const [employees, setEmployees] = useState<{ id: string; name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "authenticated") {
      const loadData = async () => {
        try {
          if (session.user?.role === "admin") {
            const res = await fetch("/api/admin/attendance"); // Uses existing API
            const data = await res.json();
            setEmployees(data);
          } else {
            // NOTE: You will need to create this specific API route
            const res = await fetch(`/api/attendance/stats?userId=${session.user?.id}`);
            const data = await res.json();
            setStats(data);
          }
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [status, session, router]);

  if (status === "loading" || loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="p-6">
        {session?.user?.role === "admin" ? (
          <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow">
            <h2 className="text-2xl font-semibold mb-4">Admin Dashboard</h2>
            <ul className="space-y-3">
              {employees.map((emp) => (
                <li key={emp.id} className="p-4 bg-gray-50 border rounded-lg">
                  <p className="font-medium">{emp.name}</p>
                  <p className="text-sm text-gray-600">{emp.email}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="max-w-lg mx-auto bg-white p-6 rounded-2xl shadow">
            <h2 className="text-2xl font-semibold text-center">Welcome, {session?.user?.name} 👋</h2>
            {stats && (
              <div className="mt-6 space-y-3">
                <div className="flex justify-between p-3 border rounded-lg">
                  <span>📅 Hadir</span> <span className="font-medium">{stats.hadir} hari</span>
                </div>
                <div className="flex justify-between p-3 border rounded-lg">
                  <span>✅ Persentase</span> <span className="font-medium">{stats.persentase}%</span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}