import { BunVenitClient } from "./BunVenitClient";

type PageProps = {
  searchParams?: Promise<{ slug?: string }>;
};

export default async function BunVenitPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : {};
  const slug = typeof sp.slug === "string" ? sp.slug : "businessul-tau";

  return <BunVenitClient slug={slug} />;
}
