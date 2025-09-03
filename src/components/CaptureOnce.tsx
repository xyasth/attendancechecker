"use client";

import { useEffect, useRef, useState } from "react";
import type Human from "@vladmandic/human";

export default function FaceCapture({ onComplete }: { onComplete: (embedding: number[]) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [human, setHuman] = useState<Human | null>(null);
  const [loading, setLoading] = useState(false);
  const [captured, setCaptured] = useState(false); // 🔹 Track if already captured

  useEffect(() => {
    let h: Human;

    async function load() {
      const HumanLib = (await import("@vladmandic/human")).default;
      h = new HumanLib({
        modelBasePath: "https://vladmandic.github.io/human/models",
        backend: "cpu",
      });
      await h.load();
      await h.warmup();
      setHuman(h);
    }

    load();

    async function initCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    }
    initCamera();

    const videoEl = videoRef.current; // ✅ snapshot

    return () => {
      if (videoEl?.srcObject) {
        (videoEl.srcObject as MediaStream)
          .getTracks()
          .forEach((t) => t.stop());
      }
    };
  }, []);


  async function takeCapture() {
    if (!human || !videoRef.current || captured) return;

    videoRef.current.pause();
    setLoading(true);

    setTimeout(async () => {
      const result = await human.detect(videoRef.current as HTMLVideoElement);

      if (result.face.length > 0) {
        const embedding = result.face[0].embedding as number[];
        onComplete(embedding);
        setCaptured(true);
      } else {
        alert("No face detected, try again");
        videoRef.current!.play();
      }

      setLoading(false);
    }, 50);
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="rounded-full w-64 h-64 object-cover border-4 border-blue-400"
      />

      {loading ? (
        <p className="text-blue-600 font-semibold">Processing...</p>
      ) : (
        <button
          className={`px-4 py-2 rounded text-white ${captured ? "bg-gray-400 cursor-not-allowed" : "bg-green-500"
            }`}
          onClick={takeCapture}
          disabled={captured}
        >
          {captured ? "Captured" : "Capture Face"}
        </button>
      )}
    </div>
  );
}
