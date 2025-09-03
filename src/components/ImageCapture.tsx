"use client";

import { useEffect, useState } from "react";
import type Human from "@vladmandic/human";
import Image from "next/image";

export default function ImageFaceCapture({
  onComplete,
}: {
  onComplete: (embeddings: number[][]) => void;
}) {
  const [human, setHuman] = useState<Human | null>(null);
  const [captures, setCaptures] = useState<number[][]>([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

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
  }, []);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!human) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreview(url);
    setLoading(true);

    const img = new window.Image();
    img.src = url;
    await new Promise((resolve) => {
      img.onload = () => resolve(true);
    });

    const result = await human.detect(img);

    if (result.face.length > 0) {
      const embedding = result.face[0].embedding as number[];
      setCaptures((prev) => {
        const updated = [...prev, embedding];
        if (updated.length >= 3) {
          onComplete(updated);
        }
        return updated;
      });
    } else {
      alert("No face detected in this image");
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <input
        type="file"
        accept="image/*"
        className="border p-2"
        onChange={handleImageUpload}
      />

      {preview && (
        <div className="relative w-64 h-64">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="rounded-lg object-cover border-4 border-blue-400"
          />
        </div>
      )}

      {loading && <p className="text-blue-600 font-semibold">Processing...</p>}

      <p className="text-gray-600">Faces captured: {captures.length}/3</p>
    </div>
  );
}
  