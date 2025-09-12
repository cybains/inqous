// types/documents.ts
export type DocStatus = "uploaded" | "parsed" | "verified" | "needs_verification";
export type Tick = "grey" | "yellow" | "green" | "red";
export interface ResumeDocument {
  _id: string;
  userId: string;
  type: "resume";
  fullName: string;
  originalFileName: string;
  mimeType: string;
  size: number;
  storage: { kind: "local_tmp" | "s3"; path?: string; url?: string };
  isLatest: boolean;
  status: DocStatus;
  tick: Tick;
  createdAt: Date;
  parsedAt: Date | null;
  verifiedAt: Date | null;
}
