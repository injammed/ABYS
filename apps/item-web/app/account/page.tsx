import Link from "next/link";
import { AuthPanel } from "@/components/AuthPanel";

export default function AccountPage() {
  return (
    <main>
      <nav style={{ padding: "1rem" }}>
        <Link href="/">← SLOP TROUGH™</Link>
      </nav>
      <AuthPanel />
    </main>
  );
}
