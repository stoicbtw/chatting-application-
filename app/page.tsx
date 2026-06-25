import { redirect } from "next/navigation";
import { getSessionId } from "@/lib/session";

export default async function Home() {
  const id = await getSessionId();
  redirect(id ? "/chat" : "/login");
}
