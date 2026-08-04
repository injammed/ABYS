import Link from "next/link";
import { ThreeMinuteSimulator } from "@/components/ThreeMinuteSimulator";

export const metadata = {
  title: "Three-Minute Beta Simulator · AI / ST",
  description: "A deterministic working simulation of one person completing a full ITEM Museum / SLOP TROUGH interaction cycle."
};

export default function SimulatorPage() {
  return (
    <main>
      <nav style={{ position: "fixed", zIndex: 50, top: ".7rem", left: ".7rem" }}>
        <Link
          href="/"
          style={{
            display: "inline-block",
            border: "1px solid rgba(255,255,255,.16)",
            borderRadius: "999px",
            background: "rgba(5,5,5,.82)",
            color: "#c8c2b6",
            padding: ".55rem .75rem",
            textDecoration: "none",
            fontSize: ".72rem",
            backdropFilter: "blur(16px)"
          }}
        >
          ← AI / ST gateway
        </Link>
      </nav>
      <ThreeMinuteSimulator />
    </main>
  );
}
