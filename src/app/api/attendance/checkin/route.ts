// app/api/checkin/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CloudClient, Collection } from "chromadb";

export async function POST(req: Request) {
  try {
    const { embeddings } = await req.json(); // embeddings from the camera

    if (!embeddings || embeddings.length === 0) {
      return NextResponse.json({ error: "No embeddings provided" }, { status: 400 });
    }

    const chromaClient = new CloudClient();
    let myCollection: Collection | null = null;

    const getMyCollection = async () => {
      if (!myCollection) {
        myCollection = await chromaClient.getOrCreateCollection({
          name: "attendance_faces",
          embeddingFunction: null,
        });
      }
      return myCollection;
    };

    const collection = await getMyCollection();

    const result = await collection.query({
      queryEmbeddings: [embeddings],
      nResults: 1,
    });

    if (!result.ids || result.ids.length === 0 || result.ids[0].length === 0) {
      return NextResponse.json({ error: "No match found" }, { status: 404 });
    }

    const matchedMetadata = result.metadatas?.[0]?.[0] ?? null;

    if (!matchedMetadata) {
      return NextResponse.json({ error: "No metadata found for match" }, { status: 404 });
    }

    const email = typeof matchedMetadata.email === "string" ? matchedMetadata.email : undefined;

    if (!email) {
      return NextResponse.json({ error: "Invalid email in metadata" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found in DB" }, { status: 404 });
    }

    // Record attendance in DB
    await prisma.absensi.create({
      data: {
        userId: user.id,
        status: "hadir",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Present successful for ${user.name}`,
      user,
    });
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
