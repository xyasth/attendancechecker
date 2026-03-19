import { ChromaClient } from "chromadb";

if (!process.env.CHROMA_API_KEY) {
  throw new Error("CHROMA_API_KEY is not set");
}

const client = new ChromaClient({
  path: "https://api.trychroma.com", // Chroma Cloud base URL
  auth: { provider: "token", credentials: process.env.CHROMA_API_KEY },
});

export default client;
