
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
// Import the client component
import ResumeDashboard from "@/components/ResumeDashboard";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/"); // kick unauthenticated users back to the sign-in page
  }

  // If you want a tiny header with user info, put it INSIDE ResumeDashboard later.
  return <ResumeDashboard />;
}
