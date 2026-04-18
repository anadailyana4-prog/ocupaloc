import type Stripe from "stripe";

type ProfessionalIdentity = {
  profesionistId: string;
  userId: string;
  slug: string;
  businessName: string;
  email: string | null;
};

async function findByMetadata(stripe: Stripe, profesionistId: string): Promise<Stripe.Customer | null> {
  try {
    const result = await stripe.customers.search({
      query: `metadata['profesionist_id']:'${profesionistId}'`,
      limit: 1
    });
    return result.data[0] ?? null;
  } catch {
    return null;
  }
}

async function findByEmail(stripe: Stripe, email: string | null): Promise<Stripe.Customer | null> {
  if (!email) {
    return null;
  }

  const list = await stripe.customers.list({
    email,
    limit: 1
  });

  return list.data[0] ?? null;
}

export async function getOrCreateStripeCustomer(stripe: Stripe, identity: ProfessionalIdentity): Promise<Stripe.Customer> {
  const existing =
    (await findByMetadata(stripe, identity.profesionistId)) ??
    (await findByEmail(stripe, identity.email));

  if (existing) {
    const needsUpdate =
      existing.email !== identity.email ||
      existing.name !== identity.businessName ||
      existing.metadata?.profesionist_id !== identity.profesionistId ||
      existing.metadata?.user_id !== identity.userId ||
      existing.metadata?.slug !== identity.slug;

    if (needsUpdate) {
      return stripe.customers.update(existing.id, {
        email: identity.email ?? undefined,
        name: identity.businessName,
        metadata: {
          profesionist_id: identity.profesionistId,
          user_id: identity.userId,
          slug: identity.slug
        }
      });
    }

    return existing;
  }

  return stripe.customers.create({
    email: identity.email ?? undefined,
    name: identity.businessName,
    metadata: {
      profesionist_id: identity.profesionistId,
      user_id: identity.userId,
      slug: identity.slug
    }
  });
}
