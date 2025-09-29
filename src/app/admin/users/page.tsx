import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.email !== "abainscp@gmail.com") redirect("/");

  const users = await prisma.user.findMany({ orderBy: { id: "desc" } });

  type AdminUser = typeof users[number];

  return (
    <main className="p-8">
      <h1 className="text-xl font-semibold mb-4">Users</h1>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left p-2">Name</th>
            <th className="text-left p-2">Email</th>
            <th className="text-left p-2">ID</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u: AdminUser) => (
            <tr key={u.id}>
              <td className="p-2">{u.name}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">{u.id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}


