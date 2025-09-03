import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CloudClient, Collection } from "chromadb";

export async function POST(req: Request) {
  try {
    const { name, email, embeddings }: {
      name: string;
      email: string;
      embeddings: number[][];
    } = await req.json();


    const user = await prisma.user.create({
      data: { name, email },
    });

    // chromadb logic
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

    const ids = embeddings.map((_, idx) => `${user.id}-${idx}`);
    const metadatas = embeddings.map(() => ({ name, email }));

    await collection.add({
      ids,
      embeddings, // already an array of arrays
      metadatas,
    });

    return NextResponse.json({ success: true, user });
  } catch (err: unknown) {
    console.error(err);
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }

}
