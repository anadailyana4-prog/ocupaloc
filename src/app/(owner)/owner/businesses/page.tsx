import Link from "next/link";
import { redirect } from "next/navigation";

import { logOwnerAction, requireOwnerAdmin } from "@/lib/owner/auth";
import { getOwnerBusinessList } from "@/lib/owner/data";

function statusBadge(status: string) {
  if (status === "paid") return "bg-emerald-500/10 text-emerald-200 border-emerald-500/30";
  if (status === "trial") return "bg-cyan-500/10 text-cyan-200 border-cyan-500/30";
  if (status === "canceled") return "bg-red-500/10 text-red-200 border-red-500/30";
  if (status === "expired") return "bg-orange-500/10 text-orange-200 border-orange-500/30";
  return "bg-slate-500/10 text-slate-200 border-slate-500/30";
}

export default async function OwnerBusinessesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  try {
    await requireOwnerAdmin();
  } catch {
    redirect("/owner/login");
  }

  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : "";
  const status = typeof params.status === "string" ? params.status : "all";
  const sortBy = (typeof params.sortBy === "string" ? params.sortBy : "created_at") as
    | "created_at"
    | "business_name"
    | "last_activity"
    | "bookings";
  const sortDir = (typeof params.sortDir === "string" ? params.sortDir : "desc") as "asc" | "desc";
  const page = Math.max(1, Number.parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1);

  const result = await getOwnerBusinessList({
    search: search || undefined,
    status,
    sortBy,
    sortDir,
    page,
    pageSize: 25
  });

  await logOwnerAction("view_section", "businesses", undefined, {
    page,
    status,
    sortBy,
    sortDir,
    search: search || null
  });

  const prevPage = Math.max(1, result.page - 1);
  const nextPage = Math.min(result.totalPages, result.page + 1);

  const baseQuery = new URLSearchParams();
  if (search) baseQuery.set("search", search);
  if (status && status !== "all") baseQuery.set("status", status);
  if (sortBy !== "created_at") baseQuery.set("sortBy", sortBy);
  if (sortDir !== "desc") baseQuery.set("sortDir", sortDir);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Businesses</h1>
        <p className="text-slate-400 mt-1">Search, filter, sort and inspect customer businesses</p>
      </div>

      <form className="rounded-lg border border-slate-700 bg-slate-900/40 p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search name, slug, email"
          className="md:col-span-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
        />
        <select name="status" defaultValue={status} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100">
          <option value="all">All statuses</option>
          <option value="paid">Paid</option>
          <option value="trial">Trial</option>
          <option value="canceled">Canceled</option>
          <option value="expired">Expired</option>
          <option value="no_subscription">No subscription</option>
        </select>
        <select name="sortBy" defaultValue={sortBy} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100">
          <option value="created_at">Newest</option>
          <option value="business_name">Business name</option>
          <option value="last_activity">Last activity</option>
          <option value="bookings">Bookings</option>
        </select>
        <select name="sortDir" defaultValue={sortDir} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100">
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
        <button className="md:col-span-5 w-full md:w-auto px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-100 font-medium" type="submit">
          Apply filters
        </button>
      </form>

      <div className="text-sm text-slate-400">Showing {result.items.length} of {result.total} businesses</div>

      <div className="rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50 border-b border-slate-700">
              <tr className="text-left text-xs font-semibold text-slate-300 uppercase tracking-wide">
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Owner / Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Trial Expiry</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Locations</th>
                <th className="px-4 py-3">Bookings</th>
                <th className="px-4 py-3">Last Activity</th>
                <th className="px-4 py-3">Email Flag</th>
                <th className="px-4 py-3">Issue Flag</th>
                <th className="px-4 py-3">Sub Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {result.items.map((business) => (
                <tr key={business.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-4 py-3">
                    <Link href={`/owner/businesses/${business.id}`} className="font-medium text-amber-200 hover:text-amber-100">
                      {business.businessName}
                    </Link>
                    <p className="text-xs text-slate-500">/{business.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">{business.ownerEmail ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge(business.status)}`}>
                      {business.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">
                    {business.trialExpiry ? new Date(business.trialExpiry).toLocaleDateString("ro-RO") : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">{business.currentPlan}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{business.locationsCount}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{business.bookingsCount}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">
                    {business.lastActivity ? new Date(business.lastActivity).toLocaleDateString("ro-RO") : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">{business.recentEmailActivity ? "yes" : "not instrumented yet"}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{business.recentIssue ? "yes" : "no"}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{business.subscriptionActive ? "yes" : "no"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Link
          href={`/owner/businesses?${new URLSearchParams({ ...Object.fromEntries(baseQuery.entries()), page: String(prevPage) }).toString()}`}
          className={`px-3 py-2 rounded-lg border border-slate-700 text-sm ${result.page <= 1 ? "pointer-events-none opacity-50" : "text-slate-200"}`}
        >
          Previous
        </Link>
        <p className="text-sm text-slate-400">Page {result.page} / {result.totalPages}</p>
        <Link
          href={`/owner/businesses?${new URLSearchParams({ ...Object.fromEntries(baseQuery.entries()), page: String(nextPage) }).toString()}`}
          className={`px-3 py-2 rounded-lg border border-slate-700 text-sm ${result.page >= result.totalPages ? "pointer-events-none opacity-50" : "text-slate-200"}`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
