"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// 1. Move the logic into a sub-component
function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "Unknown";

  let message = "Something went wrong.";
  if (error === "AccessDenied") {
    message = "Your email is not registered. Please register first.";
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
      <h1 className="text-2xl font-bold text-red-600">Authentication Error</h1>
      <p className="mt-4 text-gray-600">{message}</p>

      <Link
        href="/register"
        className="mt-6 inline-block bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
      >
        Register
      </Link>
    </div>
  );
}

// 2. Export the main page wrapped in Suspense
export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Suspense fallback={<div className="text-gray-500">Loading error details...</div>}>
        <ErrorContent />
      </Suspense>
    </div>
  );
}