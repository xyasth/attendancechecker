"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Loading from "@/components/Loading"; 

const FaceCapture = dynamic(() => import("@/components/ImageCapture"), { ssr: false });

export default function RegisterPage() {
    const [step, setStep] = useState(1);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [embeddings, setEmbeddings] = useState<number[][]>([]);
    const [loading, setLoading] = useState(false);

    async function handleSubmit() {
        setLoading(true);
        try {
            const res = await fetch("/api/register", {
                method: "POST",
                body: JSON.stringify({ name, email, embeddings }),
                headers: { "Content-Type": "application/json" },
            });

            if (res.ok) {
                alert("User registered successfully!");
            } else {
                alert("Failed to register user");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            {loading && <Loading />}
            {step === 1 && (
                <div className="w-full max-w-sm space-y-4">
                    <h1 className="text-xl font-bold">Register User</h1>
                    <input
                        className="border rounded p-2 w-full"
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <input
                        className="border rounded p-2 w-full"
                        placeholder="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <button
                        className="w-full bg-blue-500 text-white p-2 rounded"
                        onClick={() => setStep(2)}
                    >
                        Next
                    </button>
                </div>
            )}

            {step === 2 && (
                <FaceCapture
                    onComplete={(captures: number[][]) => {
                        setEmbeddings(captures);
                        setStep(3);
                    }}
                />
            )}

            {step === 3 && (
                <div className="space-y-4 text-center">
                    <p className="text-green-600">Face captured successfully!</p>
                    <button
                        className="w-full bg-blue-500 text-white p-2 rounded"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? "Submitting..." : "Submit Registration"}
                    </button>
                </div>
            )}
        </div>
    );
}
