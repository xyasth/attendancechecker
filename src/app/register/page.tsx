"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const FaceCapture = dynamic(() => import("@/components/FaceCapture"), { ssr: false });

export default function RegisterPage() {
    const [step, setStep] = useState(1);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [embeddings, setEmbeddings] = useState<number[][]>([]);

    async function handleSubmit() {
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
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
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
                    >
                        Submit Registration
                    </button>
                </div>
            )}
        </div>
    );
}
