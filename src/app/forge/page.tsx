import { Navbar } from "@/components/layout/navbar";
import { Workspace } from "@/components/forge/workspace";

export const metadata = {
  title: "Forge — InfraForge",
  description: "Design your cloud infrastructure with AI",
};

export default function ForgePage() {
  return (
    <div className="flex flex-col h-full bg-[#080808]">
      <Navbar minimal />
      <main className="flex-1 overflow-hidden" style={{ marginTop: "56px" }}>
        <Workspace />
      </main>
    </div>
  );
}
