"use client";

import Link from "next/link";

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const error = searchParams?.error || "Unknown";

  let message = "Something went wrong.";
  if (error === "AccessDenied") {
    message = "your email is not registered. Please regitser first.";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
        <h1 className="text-2xl font-bold text-red-600">Authentication Error</h1>
        <p className="mt-4 text-gray-600">{message}</p>

        <Link
          href="/register"
          className="mt-6 inline-block bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          register
        </Link>
      </div>
    </div>
  );
}
