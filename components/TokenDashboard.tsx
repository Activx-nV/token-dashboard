"use client";

import { useAccount, useChainId } from "wagmi";
import { TOKENS } from "@/constants/tokens";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, AlertTriangle } from "lucide-react";
import { TokenCard } from "./TokenCard";

export const TokenDashboard = () => {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-20">
        <Card className="max-w-2xl mx-auto bg-white/20 backdrop-blur-1xl border-0">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-6 bg-primary/10 rounded-full">
                <Wallet className="w-16 h-16 text-primary" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-8">Connect Your Wallet</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-xl mx-auto">
              <div className="p-4 bg-muted/5 rounded-lg backdrop-blur-1xl">
                <div className="text-3xl mb-2">👀</div>
                <h3 className="font-semibold mb-1">View Balances</h3>
              </div>
              <div className="p-4 bg-muted/5 rounded-lg backdrop-blur-1xl">
                <div className="text-3xl mb-2">💸</div>
                <h3 className="font-semibold mb-1">Transfer</h3>
              </div>
              <div className="p-4 bg-muted/5 rounded-lg backdrop-blur-1xl">
                <div className="text-3xl mb-2">✅</div>
                <h3 className="font-semibold mb-1">Approve</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tokens = TOKENS[chainId as keyof typeof TOKENS] || [];

  if (tokens.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription className="ml-2">
            <strong className="font-semibold">Network Not Supported</strong>
            <p className="mt-1">
              Please switch to Ethereum Mainnet or Sepolia Testnet
            </p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tokens.map((token) => (
          <TokenCard key={token.address} token={token} />
        ))}
      </div>
    </div>
  );
};
