import { redirect } from "next/navigation";

/**
 * Root redirect: send users to /office if authenticated, /login otherwise.
 * The actual auth check happens in the office layout (server-side cookie read).
 */
export default function RootPage() {
  redirect("/office");
}
