// app/page.tsx
"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md text-center">
        <h1 className="text-2xl font-bold mb-6">Welcome</h1>

        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Register
          </Link>
          <Link
            href="/login"
            className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Login
          </Link>
          <Link
            href="/absen"
            className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            presence
          </Link>
        </div>
      </div>
    </div>
  );
}
