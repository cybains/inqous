// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;

// Ensure Node.js runtime (MongoDB/Prisma need Node, not Edge)
export const runtime = "nodejs";
