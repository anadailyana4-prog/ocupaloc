import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog OcupaLoc - Programari Online pentru Saloane",
  description:
    "Articole pentru saloane beauty despre programari online, creștere fără comision, retenție și optimizare operațională cu software salon."
};

const posts = [
  {
    slug: "fresha-cat-costa-romania",
    title: "Cât te costă platformele cu comision și cum îți protejezi marja",
    excerpt: "Analiză detaliată a costurilor pe comision și de ce modelul 59,99 RON fără comision poate fi mai profitabil."
  },
  {
    slug: "cum-sa-reduci-anularile",
    title: "Cum să reduci anulările și no-show-urile în salon",
    excerpt: "Strategii practice pentru programari online mai stabile și clienți mai disciplinați."
  },
  {
    slug: "telefon-vs-programari-online",
    title: "Telefon vs programări online: ce aduce mai multe încasări",
    excerpt: "Comparație directă între modelul clasic pe telefon și fluxul modern de software salon."
  }
];

export default function BlogIndexPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-14 text-zinc-100">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">Blog despre programari online pentru saloane beauty</h1>
          <p className="text-zinc-400">Resurse practice pentru frizerie, manichiură și cosmetică: procese mai bune, costuri mai mici, creștere fără comision.</p>
        </header>
        <div className="space-y-4">
          {posts.map((post) => (
            <article key={post.slug} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
              <h2 className="text-2xl font-semibold">
                <Link href={`/blog/${post.slug}`} className="hover:text-indigo-300">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-2 text-zinc-400">{post.excerpt}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
