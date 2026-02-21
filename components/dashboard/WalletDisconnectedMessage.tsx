import { Card, CardContent } from "../ui/card";
import { Wallet } from "lucide-react";

export const WalletDisconnectedMessage = () => {
  return (
    <div className="container mx-auto px-4 py-20">
      <Card className="max-w-2xl mx-auto bg-white/10 backdrop-blur-1xl border-0">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-6 bg-black/50 rounded-full">
              <Wallet className="w-16 h-16 text-gray-200" />
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-8 text-gray-200">
            Connect Your Wallet
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-xl mx-auto text-gray-200">
            <div className="p-4 bg-black/50 rounded-lg backdrop-blur-3xl hover:scale-[1.05] transition-all duration-300">
              <div className="text-3xl mb-2">👀</div>
              <h3 className="font-semibold mb-1">View Balances</h3>
            </div>
            <div className="p-4 bg-black/50 rounded-lg backdrop-blur-3xl hover:scale-[1.05] transition-all duration-300">
              <div className="text-3xl mb-2">💸</div>
              <h3 className="font-semibold mb-1">Transfer</h3>
            </div>
            <div className="p-4 bg-black/50 rounded-lg backdrop-blur-3xl hover:scale-[1.05] transition-all duration-300">
              <div className="text-3xl mb-2">✅</div>
              <h3 className="font-semibold mb-1">Approve</h3>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
