"use server";

import { createClient } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type BootstrapService = {
  nume: string;
  pret: string;
  durata: string;
};

type BootstrapWorkDay = {
  key: "luni" | "marti" | "miercuri" | "joi" | "vineri" | "sambata" | "duminica";
  active: boolean;
  start: string;
  end: string;
};

function mapActivity(activity: string | undefined): string {
  const value = (activity ?? "").toLowerCase();
  if (value.includes("frizer")) return "frizerie";
  if (value.includes("manichi")) return "manichiura";
  if (value.includes("coaf")) return "coafor";
  return "altul";
}

function buildProgram(workDays: BootstrapWorkDay[] | undefined): Record<string, [string, string] | []> {
  const fallback: Record<string, [string, string] | []> = {
    luni: ["09:00", "18:00"],
    marti: ["09:00", "18:00"],
    miercuri: ["09:00", "18:00"],
    joi: ["09:00", "18:00"],
    vineri: ["09:00", "18:00"],
    sambata: [],
    duminica: []
  };

  if (!workDays?.length) {
    return fallback;
  }

  const program: Record<string, [string, string] | []> = { ...fallback };
  workDays.forEach((day) => {
    if (!day.active) {
      program[day.key] = [];
      return;
    }
    const start = /^\d{2}:\d{2}$/.test(day.start) ? day.start : "09:00";
    const end = /^\d{2}:\d{2}$/.test(day.end) ? day.end : "18:00";
    program[day.key] = [start, end];
  });
  return program;
}

function sanitizeSlug(raw: string | undefined): string {
  const value = (raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return value || "studio";
}

export async function bootstrapTenantAfterSignup(input: {
  orgName: string;
  slug: string;
  activity?: string;
  phone?: string;
  services?: BootstrapService[];
  workDays?: BootstrapWorkDay[];
  /** Optional: pass the userId directly from signUp response to skip getUser() */
  userId?: string;
}) {
  let userId: string;

  if (input.userId) {
    userId = input.userId;
  } else {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userErr
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      return { ok: false as const, error: "Nu ești autentificat." };
    }
    userId = user.id;
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return { ok: false as const, error: "Lipsește SUPABASE_SERVICE_ROLE_KEY pe server." };
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: existing } = await admin.from("profesionisti").select("id").eq("user_id", userId).maybeSingle();
  let profesionistId = existing?.id ?? null;

  if (!profesionistId) {
    const baseSlug = sanitizeSlug(input.slug || input.orgName);
    for (let attempt = 1; attempt <= 15 && !profesionistId; attempt += 1) {
      const slugCandidate = attempt === 1 ? baseSlug : `${baseSlug}-${attempt}`;
      const { data: inserted, error: insErr } = await admin
        .from("profesionisti")
        .insert({
          user_id: userId,
          nume_business: input.orgName,
          tip_activitate: mapActivity(input.activity),
          telefon: input.phone?.trim() || null,
          slug: slugCandidate,
          onboarding_pas: 4,
          program: buildProgram(input.workDays)
        })
        .select("id")
        .maybeSingle();

      if (!insErr) {
        profesionistId = inserted?.id ?? null;
        continue;
      }

      const isSlugConflict = insErr.code === "23505" && insErr.message.toLowerCase().includes("slug");
      if (isSlugConflict) {
        continue;
      }

      const isUserConflict = insErr.code === "23505" && insErr.message.toLowerCase().includes("user_id");
      if (isUserConflict) {
        const { data: created } = await admin.from("profesionisti").select("id").eq("user_id", userId).maybeSingle();
        profesionistId = created?.id ?? null;
        continue;
      }

      return { ok: false as const, error: insErr.message };
    }
  }

  if (!profesionistId) {
    return { ok: false as const, error: "Nu am putut pregăti profilul profesionistului." };
  }

  // Ensure tenant record exists before inserting servicii (servicii.tenant_id FK → tenants.id)
  const { data: existingTenant } = await admin.from("tenants").select("id").eq("id", profesionistId).maybeSingle();
  if (!existingTenant) {
    const { data: profData } = await admin.from("profesionisti").select("slug, nume_business").eq("id", profesionistId).maybeSingle();
    const baseSlug = profData?.slug ?? profesionistId.slice(0, 8);
    const slugCandidates = [baseSlug, `${baseSlug}-${profesionistId.slice(0, 8)}`];
    let tenantCreated = false;
    for (const candidateSlug of slugCandidates) {
      const { error: tenantErr } = await admin.from("tenants").insert({
        id: profesionistId,
        slug: candidateSlug,
        name: profData?.nume_business ?? baseSlug
      });
      if (!tenantErr) {
        tenantCreated = true;
        break;
      }
      const isSlugConflict = tenantErr.code === "23505" && tenantErr.message.toLowerCase().includes("slug");
      if (!isSlugConflict) {
        return { ok: false as const, error: tenantErr.message };
      }
    }
    if (!tenantCreated) {
      return { ok: false as const, error: "Nu am putut sincroniza tenant-ul pentru acest cont." };
    }
  }

  const draftServices = (input.services ?? [])
    .map((service) => {
      const name = service.nume.trim();
      const duration = Number(service.durata);
      const price = Number(service.pret);
      if (!name) return null;
      if (!Number.isFinite(duration) || duration <= 0) return null;
      if (!Number.isFinite(price) || price < 0) return null;
      return {
        profesionist_id: profesionistId,
        tenant_id: profesionistId,
        nume: name,
        durata_minute: duration,
        pret: price,
        activ: true
      };
    })
    .filter(Boolean);

  if (draftServices.length > 0) {
    const { error: servicesErr } = await admin.from("servicii").insert(draftServices);
    if (servicesErr) {
      return { ok: false as const, error: servicesErr.message };
    }
  }

  return { ok: true as const };
}
