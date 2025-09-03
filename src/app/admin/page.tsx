"use client";
import { useEffect, useState } from "react";

interface Employee {
  id: string;
  name: string;
  email: string;
  attended: boolean;
}

export default function AdminDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/admin/attendance");
      const data: Employee[] = await res.json();
      setEmployees(data);
    };
    fetchData();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border px-4 py-2">Name</th>
            <th className="border px-4 py-2">Email</th>
            <th className="border px-4 py-2">Attendance</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td className="border px-4 py-2">{emp.name}</td>
              <td className="border px-4 py-2">{emp.email}</td>
              <td className="border px-4 py-2">
                {emp.attended ? "✅ Hadir" : "❌ Belum hadir"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
