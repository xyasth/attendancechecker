"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const FaceCapture = dynamic(() => import("@/components/CaptureOnce"), { ssr: false });

export default function EmployeePage() {
  const [status, setStatus] = useState("");
  const [step, setStep] = useState(1);
  const [embeddings, setEmbeddings] = useState<number[]>([]);

  async function handleCheckIn() {
    const res = await fetch("/api/attendance/checkin", {
      method: "POST",
      body: JSON.stringify({ embeddings }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    setStatus(data.message || data.error);
  }

  return (
    <div className="flex flex-col items-center p-8">
      <h1 className="text-2xl font-bold mb-4">Employee presence</h1>

      {step === 1 && (
        <FaceCapture
          onComplete={(capture) => {
            setEmbeddings(capture);
            setStep(2);
          }}
        />
      )}

      {step === 2 && (
        <div className="space-y-4 text-center">
          <p className="text-green-600">Face captured successfully!</p>
          <button
            onClick={handleCheckIn}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Submit presence
          </button>
        </div>
      )}

      {status && <p className="mt-4">{status}</p>}
    </div>
  );
}
