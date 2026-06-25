import { redirect } from "next/navigation";
import { getSessionId } from "@/lib/session";
import { listProfiles } from "@/app/actions";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  const id = await getSessionId();
  if (id) redirect("/chat");
  const profiles = await listProfiles();
  return (
    <main className="relative z-10 min-h-dvh grid place-items-center p-5">
      <LoginForm profiles={profiles} />
    </main>
  );
}
