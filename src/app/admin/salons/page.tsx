import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Redirects legacy /admin/salons → /admin/businesses
export default function AdminSalonsRedirect() {
  redirect("/admin/businesses");
}
