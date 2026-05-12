import Link from "next/link";
import { redirect } from "next/navigation";

import { getOwnerBusinessDetail } from "@/lib/owner/data";
import { logOwnerAction, requireOwnerAdmin } from "@/lib/owner/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function OwnerBusinessDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const banner = typeof sp.banner === "string" ? sp.banner : null;

  try {
    await requireOwnerAdmin();
    await logOwnerAction("view_business", "business", id);
  } catch {
    redirect("/owner/login");
  }

  async function addInternalNote(formData: FormData) {
    "use server";

    const admin = await requireOwnerAdmin();
    const content = String(formData.get("content") ?? "").trim();
    const followUp = String(formData.get("follow_up") ?? "") === "on";

    if (!content) {
      return;
    }

    const supabase = await createSupabaseServerClient();
    const tags = followUp ? ["follow_up"] : [];
    await supabase.from("owner_notes").insert({
      profesionist_id: id,
      content,
      tags,
      created_by: admin.user_id
    });

    await logOwnerAction("owner_note_create", "business", id, {
      followUp,
      contentLength: content.length
    });

    redirect(`/owner/businesses/${id}?banner=note_saved`);
  }

  const detail = await getOwnerBusinessDetail(id);

  if (!detail) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Business not found</p>
        <Link href="/owner/businesses" className="text-amber-400 mt-4 inline-block">
          Back to businesses
        </Link>
      </div>
    );
  }

  const { business, subscriptions, services, recentBookings, ownerNotes, activityTimeline } = detail;
  const latestSubscription = subscriptions[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">{business.nume_business}</h1>
          <p className="text-slate-400 mt-1">/{business.slug}</p>
        </div>
        <Link href="/owner/businesses" className="text-amber-400 hover:text-amber-300">
          Back
        </Link>
      </div>

      {banner === "note_saved" && (
        <div className="rounded-lg border border-emerald-600/40 bg-emerald-900/20 px-4 py-3 text-emerald-100 text-sm">
          ✓ Internal note saved.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase">Business Profile</p>
          <p className="text-slate-100 mt-2">Email: {business.email_contact ?? "-"}</p>
          <p className="text-slate-100">Phone: {business.telefon ?? "-"}</p>
          <p className="text-slate-100">Created: {new Date(business.created_at).toLocaleDateString("ro-RO")}</p>
          <p className="text-slate-100">Last activity: {business.last_activity_at ? new Date(business.last_activity_at).toLocaleDateString("ro-RO") : "—"}</p>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase">Subscription</p>
          <p className="text-slate-100 mt-2">Status: {latestSubscription?.status ?? "none"}</p>
          <p className="text-slate-100">Stripe sub id: {latestSubscription?.stripe_subscription_id ?? "-"}</p>
          <p className="text-slate-100">Stripe customer id: {latestSubscription?.stripe_customer_id ?? "-"}</p>
          <p className="text-slate-100">Trial end: {latestSubscription?.current_period_end ? new Date(latestSubscription.current_period_end).toLocaleDateString("ro-RO") : "-"}</p>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase">Usage Trends</p>
          <p className="text-slate-100 mt-2">Services: {services.length}</p>
          <p className="text-slate-100">Recent bookings: {recentBookings.length}</p>
          <p className="text-slate-100">Activity events: {activityTimeline.length}</p>
          <p className="text-slate-100">Inactivity hint: {recentBookings.length === 0 ? "signed up but no first booking" : "active"}</p>
        </div>
      </div>

      <section className="rounded-lg border border-slate-700 bg-slate-900/30 p-4">
        <h2 className="text-lg font-semibold text-slate-200 mb-3">Safe Admin Actions</h2>
        <form action={addInternalNote} className="space-y-3">
          <textarea
            name="content"
            required
            placeholder="Add internal note for this business"
            className="w-full min-h-28 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
          />
          <label className="inline-flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" name="follow_up" />
            Mark for follow-up
          </label>
          <div>
            <button type="submit" className="px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-100 font-medium">
              Save note
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-3">Recent Bookings</h2>
        <div className="space-y-2">
          {recentBookings.slice(0, 10).map((booking) => (
            <div key={booking.id} className="rounded-lg border border-slate-700 bg-slate-800/30 p-3 flex justify-between">
              <div>
                <p className="text-slate-100 font-medium">{booking.nume_client}</p>
                <p className="text-xs text-slate-400">{new Date(booking.data_start).toLocaleString("ro-RO")}</p>
              </div>
              <p className="text-sm text-slate-300">{booking.status}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-3">Internal Notes</h2>
        <div className="space-y-2">
          {ownerNotes.length === 0 ? (
            <p className="text-slate-400">No internal notes yet.</p>
          ) : (
            ownerNotes.map((note) => (
              <div key={note.id} className="rounded-lg border border-slate-700 bg-slate-800/30 p-3">
                <p className="text-slate-100 text-sm">{note.content}</p>
                <p className="text-xs text-slate-500 mt-1">{new Date(note.created_at).toLocaleDateString("ro-RO")}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-3">Activity Timeline</h2>
        <div className="space-y-2">
          {activityTimeline.length === 0 ? (
            <p className="text-slate-400">not instrumented yet</p>
          ) : (
            activityTimeline.slice(0, 20).map((event) => (
              <div key={event.id} className="rounded-lg border border-slate-700 bg-slate-800/20 p-3 flex justify-between">
                <p className="text-slate-200">{event.event_type}</p>
                <p className="text-xs text-slate-500">{new Date(event.created_at).toLocaleString("ro-RO")}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
