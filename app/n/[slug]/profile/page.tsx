import { redirect } from "next/navigation";
import { myProfileInNest } from "@/app/actions";
import ProfileEditor from "@/components/ProfileEditor";

export const dynamic = "force-dynamic";

export default async function NestProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const me = await myProfileInNest(slug);
  if (!me) redirect(`/n/${slug}`);
  return (
    <main className="relative z-10 min-h-dvh flex justify-center p-3">
      <ProfileEditor profile={me} slug={slug} />
    </main>
  );
}
