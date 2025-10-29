"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { invoke } from '@tauri-apps/api/core';
const FaceCapture = dynamic(() => import("@/components/CaptureOnce"), { ssr: false });

// Define the response type from Rust
interface CheckinResponse {
    success: boolean;
    message: string;
    user?: { id: string; name: string; email: string };
    error?: string;
}


export default function EmployeePage() {
  const [status, setStatus] = useState("");
  const [step, setStep] = useState(1);
  const [embedding, setEmbedding] = useState<number[]>([]); // Changed from embeddings
  const [isLoading, setIsLoading] = useState(false); // Added loading state


  async function handleCheckIn() {
    if (!embedding || embedding.length === 0) {
        setStatus("No face embedding captured.");
        return;
    }
    setIsLoading(true);
    setStatus("Submitting attendance...");

    try {
        const response = await invoke<CheckinResponse>('checkin_user', {
             payload: { embeddings: embedding } // Pass the single embedding array
        });

        setStatus(response.message || response.error || "An unknown response occurred.");
        if (response.success) {
            console.log("Check-in successful for:", response.user?.name);
            // Optionally disable button or redirect
        } else {
             console.error("Check-in failed:", response.error);
        }

    } catch (error) {
         console.error("Error invoking checkin_user:", error);
         setStatus(`An error occurred: ${error}`);
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center p-8">
      <h1 className="text-2xl font-bold mb-4">Employee Presence</h1>

      {step === 1 && (
        <FaceCapture
          onComplete={(capture) => {
            if (capture && capture.length > 0) {
                setEmbedding(capture);
                setStep(2);
            } else {
                setStatus("Failed to capture face embedding. Please try again.");
            }
          }}
        />
      )}

      {step === 2 && (
        <div className="space-y-4 text-center">
          <p className="text-green-600">Face captured successfully!</p>
          <button
            onClick={handleCheckIn}
            className={`bg-blue-500 text-white px-4 py-2 rounded ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? "Submitting..." : "Submit Presence"}
          </button>
        </div>
      )}

      {status && <p className="mt-4">{status}</p>}
    </div>
  );
}