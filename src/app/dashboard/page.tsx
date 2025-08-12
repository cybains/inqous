import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/");
  }
  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Dashboard</h1>
      <p>Signed in as {session.user?.email}</p>
    </div>
  );
}
