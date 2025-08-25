import DocsClient from "./parts/DocsClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function DocsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Documents</h1>
        <p className="mt-1 text-sm text-gray-900">Manage uploaded resumes & extracted text.</p>
      </header>
      <DocsClient />
    </div>
  );
}
