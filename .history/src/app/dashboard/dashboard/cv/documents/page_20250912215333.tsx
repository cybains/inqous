// app/(dashboard)/dashboard/cv/documents/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import getMongoClient from "@/lib/mongo";

function Tick({ tick }: { tick: string }) {
  const map: Record<string, string> = {
    grey: "bg-gray-300",
    yellow: "bg-yellow-400",
    green: "bg-green-500",
    red: "bg-red-500",
  };
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${map[tick] || "bg-gray-300"}`} />;
}

export default async function DocumentsPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const client = await getMongoClient();
  const db = client.db(process.env.MONGODB_JOBS_DB || "jobsdb");
  const docs = userId
    ? await db.collection("documents").find({ userId }).sort({ createdAt: -1 }).limit(50).toArray()
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Documents</h1>
        <p className="text-sm text-gray-600">Manage your resumes and other uploads.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-gray-600">
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Tick</th>
              <th className="px-4 py-3">Latest</th>
              <th className="px-4 py-3">Uploaded</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {docs.map((d: any) => (
              <tr key={d._id} className="text-gray-800">
                <td className="px-4 py-3">{d.originalFileName}</td>
                <td className="px-4 py-3 uppercase">{d.type}</td>
                <td className="px-4 py-3">{d.status}</td>
                <td className="px-4 py-3"><Tick tick={d.tick} /></td>
                <td className="px-4 py-3">{d.isLatest ? "Yes" : "No"}</td>
                <td className="px-4 py-3">{new Date(d.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {docs.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={6}>No documents yet — upload your CV from the top bar or Quick actions.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
