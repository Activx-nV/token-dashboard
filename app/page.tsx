import { TokenDashboard } from "@/components/dashboard/TokenDashboard";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white">ERC-20</h1>
          </div>
          <ConnectButton />
        </header>

        <TokenDashboard />
      </div>
    </main>
  );
}
