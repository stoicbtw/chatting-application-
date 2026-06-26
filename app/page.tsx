import { listMyNests } from "@/app/actions";
import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const nests = await listMyNests();
  return (
    <main className="relative z-10 min-h-dvh flex justify-center p-4">
      <Dashboard nests={nests} />
    </main>
  );
}
