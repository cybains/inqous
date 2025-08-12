import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  const u = session?.user;
  return (
    <main className="p-8">
      <h1>Dashboard</h1>
      {u ? (
        <div className="mt-4 space-y-2">
          <div><b>Name:</b> {u.name}</div>
          <div><b>Email:</b> {u.email}</div>
          {u.image && (
            <img src={u.image} alt="avatar" className="h-12 w-12 rounded-full" />
          )}
        </div>
      ) : (
        <p>Not signed in.</p>
      )}
    </main>
  );
}
