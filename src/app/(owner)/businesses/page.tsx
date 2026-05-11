"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getBusinessList } from "@/lib/owner/stats";

type Business = {
  id: string;
  nume_business: string;
  slug: string;
  email_contact: string;
  created_at: string;
  status: string;
  num_bookings: number;
  last_activity_at?: string;
};

export default function OwnerBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const loadBusinesses = async () => {
      setLoading(true);
      const result = await getBusinessList(100, 0, search || undefined);
      if (result) {
        setBusinesses(result.data as Business[]);
        setTotal(result.total);
      }
      setLoading(false);
    };

    const timer = setTimeout(loadBusinesses, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-emerald-500/10 text-emerald-100 border-emerald-500/30",
      trial: "bg-cyan-500/10 text-cyan-100 border-cyan-500/30",
      canceled: "bg-red-500/10 text-red-100 border-red-500/30",
      no_subscription: "bg-slate-500/10 text-slate-100 border-slate-500/30"
    };
    return colors[status] || colors.no_subscription;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Businesses</h1>
        <p className="text-slate-400 mt-1">Manage all customer accounts</p>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search by name, slug, or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      {/* Info */}
      <div className="text-sm text-slate-400">
        Showing {businesses.length} of {total} accounts
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8 text-slate-400">Loading...</div>
      ) : businesses.length === 0 ? (
        <div className="text-center py-8 text-slate-400">No businesses found</div>
      ) : (
        <div className="rounded-lg border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50 border-b border-slate-700">
                <tr className="text-left text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  <th className="px-4 py-3">Business</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Bookings</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Last Activity</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {businesses.map(business => (
                  <tr key={business.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-100">
                          {business.nume_business}
                        </p>
                        <p className="text-xs text-slate-500">{business.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {business.email_contact}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor(
                          business.status
                        )}`}
                      >
                        {business.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {business.num_bookings}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {new Date(business.created_at).toLocaleDateString("ro-RO")}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {business.last_activity_at
                        ? new Date(business.last_activity_at).toLocaleDateString(
                            "ro-RO"
                          )
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/owner/businesses/${business.id}`}
                        className="text-amber-400 hover:text-amber-300 text-sm font-medium"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
