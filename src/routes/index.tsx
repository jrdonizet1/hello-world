import { createFileRoute } from "@tanstack/react-router";
import { BrainLagGame } from "../components/game/BrainLagGame";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-black select-none overflow-hidden touch-none">
      <BrainLagGame />
    </div>
  );
}
