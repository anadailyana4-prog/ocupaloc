import { redirect } from "next/navigation";
import Link from "next/link";
import { requireOwnerAdmin, logOwnerAction } from "@/lib/owner/auth";
import { getBusinessDetail } from "@/lib/owner/stats";

export default async function OwnerBusinessDetailPage({
  params
}: {
  params: { id: string };
}) {
  try {
    await requireOwnerAdmin();
    await logOwnerAction("view_business", "business", params.id);
  } catch {
    redirect("/owner/login");
  }

  const detail = await getBusinessDetail(params.id);

  if (!detail) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Business not found</p>
        <Link href="/owner/businesses" className="text-amber-400 mt-4 inline-block">
          ← Back to businesses
        </Link>
      </div>
    );
  }

  const { business, subscriptions, services, recentBookings, notes } = detail;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">
            {business.nume_business}
          </h1>
          <p className="text-slate-400 mt-1">{business.slug}</p>
        </div>
        <Link
          href="/owner/businesses"
          className="text-amber-400 hover:text-amber-300"
        >
          ← Back
        </Link>
      </div>

      {/* Business Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase">
            Contact Email
          </p>
          <p className="text-slate-100 mt-2">{business.email_contact}</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase">
            Phone
          </p>
          <p className="text-slate-100 mt-2">{business.telefon || "—"}</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase">
            Created
          </p>
          <p className="text-slate-100 mt-2">
            {new Date(business.created_at).toLocaleDateString("ro-RO")}
          </p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase">
            Type
          </p>
          <p className="text-slate-100 mt-2">{business.tip_activitate}</p>
        </div>
      </div>

      {/* Subscriptions */}
      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-4">
          Subscriptions
        </h2>
        {subscriptions.length === 0 ? (
          <p className="text-slate-400">No subscriptions</p>
        ) : (
          <div className="space-y-2">
            {subscriptions.map(sub => (
              <div
                key={sub.id}
                className="rounded-lg border border-slate-700 bg-slate-800/30 p-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-slate-100">{sub.status}</p>
                    <p className="text-xs text-slate-400">
                      {sub.stripe_subscription_id}
                    </p>
                  </div>
                  {sub.current_period_end && (
                    <p className="text-sm text-slate-400">
                      Renews:{" "}
                      {new Date(sub.current_period_end).toLocaleDateString(
                        "ro-RO"
                      )}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Services */}
      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Services</h2>
        {services.length === 0 ? (
          <p className="text-slate-400">No services</p>
        ) : (
          <div className="space-y-2">
            {services.slice(0, 10).map(srv => (
              <div
                key={srv.id}
                className="rounded-lg border border-slate-700 bg-slate-800/30 p-3 flex justify-between items-start"
              >
                <div>
                  <p className="font-medium text-slate-100">{srv.nume}</p>
                  <p className="text-xs text-slate-400">
                    {srv.durata_minute} min • {srv.pret} RON
                  </p>
                </div>
                <span
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: srv.culoare + "20",
                    color: srv.culoare
                  }}
                >
                  {srv.activ ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
            {services.length > 10 && (
              <p className="text-xs text-slate-500 mt-2">
                +{services.length - 10} more services
              </p>
            )}
          </div>
        )}
      </section>

      {/* Recent Bookings */}
      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-4">
          Recent Bookings ({detail.bookingsCount})
        </h2>
        {recentBookings.length === 0 ? (
          <p className="text-slate-400">No bookings</p>
        ) : (
          <div className="space-y-2">
            {recentBookings.slice(0, 5).map(booking => (
              <div
                key={booking.id}
                className="rounded-lg border border-slate-700 bg-slate-800/30 p-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-slate-100">
                      {booking.nume_client}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(booking.data_start).toLocaleString("ro-RO")}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded">
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Owner Notes */}
      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-4">
          Owner Notes
        </h2>
        {notes.length === 0 ? (
          <p className="text-slate-400">No notes yet</p>
        ) : (
          <div className="space-y-2">
            {notes.map(note => (
              <div
                key={note.id}
                className="rounded-lg border border-slate-700 bg-slate-800/30 p-3"
              >
                <p className="text-slate-100 text-sm">{note.content}</p>
                <div className="flex justify-between items-start mt-2">
                  <div className="flex gap-1">
                    {note.tags?.map((tag: string) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 rounded bg-amber-500/10 text-amber-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(note.created_at).toLocaleDateString("ro-RO")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
