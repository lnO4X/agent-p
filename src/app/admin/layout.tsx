import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  if (!admin) {
    redirect("/dashboard");
  }

  return <AdminShell username={admin.username}>{children}</AdminShell>;
}
