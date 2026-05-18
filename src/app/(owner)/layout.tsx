export const metadata = {
  title: "OcupaLoc Owner Portal",
  description: "Owner control center for OcupaLoc",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false
    }
  }
};

export const dynamic = "force-dynamic";

export default function OwnerAppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return children;
}
