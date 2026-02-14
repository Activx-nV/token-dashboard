"use client";

import { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { ERC20_ABI } from "@/constants/abis";
import type { Token } from "@/constants/tokens";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpRight,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useTokenPrice } from "@/hooks/useTokenPrice";
import { toast } from "sonner";
import Image from "next/image";

interface TokenCardProps {
  token: Token;
}

export const TokenCard = ({ token }: TokenCardProps) => {
  const { address } = useAccount();
  const [showTransfer, setShowTransfer] = useState(false);
  const [showApprove, setShowApprove] = useState(false);

  const { data: balance, isLoading: isLoadingBalance } = useReadContract({
    abi: ERC20_ABI,
    address: token.address,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const { priceData, isLoading: isLoadingPrice } = useTokenPrice(
    token.coingeckoId,
  );

  const formattedBalance = balance ? formatUnits(balance, token.decimals) : "0";
  const usdValue = priceData?.price
    ? (parseFloat(formattedBalance) * priceData.price).toFixed(2)
    : "0.00";

  const handleAddTokenToMetaMask = async () => {
    if (window.ethereum != null) {
      try {
        const wasAdded = await window.ethereum.request({
          method: "wallet_watchAsset",
          params: {
            type: "ERC20",
            options: {
              address: token.address,
              symbol: token.symbol,
              decimals: token.decimals,
              image: token.logo,
            },
          },
        });

        if (wasAdded) {
          toast.success("Token added successfully!");
        } else {
          toast.error("Token not added.");
        }
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          "message" in error
        ) {
          if (error.code === 4001 && typeof error.message === "string") {
            toast.error(error.message);
          }
        }
      }
    }
  };

  return (
    <>
      <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Image
                  src={token.logo}
                  alt={token.symbol}
                  className="rounded-full ring-2 ring-muted"
                  width={48}
                  height={48}
                  loading="lazy"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
              </div>
              <div>
                <h3 className="font-bold text-lg">{token.symbol}</h3>
                <p className="text-xs text-muted-foreground">{token.name}</p>
              </div>
            </div>

            <div className="text-right">
              {isLoadingPrice ? (
                <Skeleton className="h-5 w-16 mb-1" />
              ) : (
                <>
                  <p className="text-sm font-bold">
                    ${priceData?.price?.toFixed(2) ?? "--"}
                  </p>
                  {priceData?.priceChange24h !== undefined && (
                    <Badge
                      variant={
                        priceData.priceChange24h >= 0
                          ? "default"
                          : "destructive"
                      }
                      className="text-xs gap-1"
                    >
                      {priceData.priceChange24h >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {Math.abs(priceData.priceChange24h).toFixed(2)}%
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="p-4 bg-primary/5 rounded-lg border">
            {isLoadingBalance ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold">
                  {parseFloat(formattedBalance).toFixed(4)}
                </p>
                <p className="text-sm text-muted-foreground">
                  ≈ ${usdValue} USD
                </p>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="text-sm font-semibold truncate">
                {parseFloat(formattedBalance).toFixed(2)} {token.symbol}
              </p>
            </div>
            <div className="p-2 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground">Value</p>
              <p className="text-sm font-semibold">${usdValue}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setShowTransfer(true)}
                className="gap-2"
                variant="default"
              >
                <ArrowUpRight className="w-4 h-4" />
                Transfer
              </Button>

              <Button
                onClick={() => setShowApprove(true)}
                className="gap-2"
                variant="secondary"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve
              </Button>
            </div>

            <Button
              onClick={handleAddTokenToMetaMask}
              variant="outline"
              className="w-full gap-2 hover:cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.05 11.36l-8.67-8.67c-.47-.47-1.24-.47-1.71 0l-1.79 1.79 2.27 2.27c.5-.17 1.08-.08 1.48.32.4.4.49.98.32 1.48l2.19 2.19c.5-.17 1.08-.08 1.48.32.56.56.56 1.47 0 2.03-.56.56-1.47.56-2.03 0-.42-.42-.51-1.03-.29-1.55l-2.04-2.04v5.37c.14.07.27.16.39.28.56.56.56 1.47 0 2.03-.56.56-1.47.56-2.03 0-.56-.56-.56-1.47 0-2.03.14-.14.3-.24.47-.32V9.66c-.17-.07-.33-.18-.47-.32-.42-.42-.51-1.03-.29-1.55L9.08 5.52l-5.8 5.8c-.47.47-.47 1.24 0 1.71l8.67 8.67c.47.47 1.24.47 1.71 0l8.63-8.63c.47-.47.47-1.24 0-1.71z" />
              </svg>
              Add to MetaMask
            </Button>
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground truncate">
              {token.address}
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
