"use client";

import { useAccount, useChainId } from "wagmi";
import { TOKENS, type Token } from "@/constants/tokens";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { TokenCard } from "@/components/dashboard/TokenCard";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { WalletDisconnectedMessage } from "./WalletDisconnectedMessage";
import { TokenSelect } from "./TokenSelect";

export const TokenDashboard = () => {
  const { isConnected, isConnecting } = useAccount();
  const chainId = useChainId();

  const [isMounted, setIsMounted] = useState(false);
  const tokens: Token[] = [
    ...(TOKENS[chainId as keyof typeof TOKENS] || []),
  ];
  const [selectedTokenAddress, setSelectedTokenAddress] = useState<
    `0x${string}` | ""
  >("");

  useEffect(() => {
    //eslint-disable-next-line
    setIsMounted(true);
  }, []);

  if (!isMounted || isConnecting) {
    return (
      <div className="flex h-[calc(100vh-12.5rem)] items-center justify-center">
        <Spinner className="size-10" stroke="white" />
      </div>
    );
  }

  if (!isConnected) {
    return <WalletDisconnectedMessage />;
  }

  if (!tokens[0]) {
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

  const selectedToken =
    tokens.find((token) => token.address === selectedTokenAddress) ?? tokens[0];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      <div className="text-white text-center max-w-2xl">
        Prices provided by CoinGecko to calculate values might be unavailable
        <br />
        due to the API&apos;s rate limits.
      </div>

      <TokenSelect
        tokens={tokens}
        selectedToken={selectedToken}
        setSelectedTokenAddress={setSelectedTokenAddress}
      />

      {selectedToken && (
        <div className="w-full max-w-xl">
          <TokenCard token={selectedToken} />
        </div>
      )}
    </div>
  );
};
