"use client";
import { useEffect, useState } from "react";
import { invoke } from '@tauri-apps/api/core';
// Define the response type from Rust
interface EmployeeAttendance {
  id: string;
  name: string;
  email: string | null; // email might be null in DB
  attended: boolean | null; // Use boolean | null to match Rust Option<bool>
}


export default function AdminDashboard() {
  const [employees, setEmployees] = useState<EmployeeAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Call the Rust command
            const data = await invoke<EmployeeAttendance[]>('get_daily_attendance');
            setEmployees(data);
        } catch (err) {
            console.error("Error fetching attendance:", err);
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []); // Empty dependency array means run once on mount

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard - Daily Attendance</h1>
      {loading && <p>Loading attendance data...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      {!loading && !error && (
          <table className="min-w-full border mt-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2 text-left">Name</th>
                <th className="border px-4 py-2 text-left">Email</th>
                <th className="border px-4 py-2 text-center">Attendance Today</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && (
                <tr>
                    <td colSpan={3} className="text-center py-4 text-gray-500">No employees found or no attendance data available.</td>
                </tr>
              )}
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{emp.name}</td>
                  <td className="border px-4 py-2">{emp.email ?? 'N/A'}</td>
                  <td className="border px-4 py-2 text-center">
                    {/* Handle null case explicitly if needed, otherwise rely on boolean display */}
                    {emp.attended === true ? "✅ Present" : (emp.attended === false ? "❌ Absent" : "❓ Unknown")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      )}
    </div>
  );
}