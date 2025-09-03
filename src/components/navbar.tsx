"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <nav className="w-full flex items-center justify-between px-6 py-4 bg-white shadow-md">
      {/* Left: Title */}
      <h1 className="text-lg font-bold">AttendanceChecker</h1>

      {/* Right: Sign Out Button */}
      <Button
        variant="destructive"
        onClick={() => signOut({ callbackUrl: "/login", redirect: true })}
      >
        Sign Out
      </Button>
    </nav>
  );
}
