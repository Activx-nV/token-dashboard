"use client";

import { useEffect, useState } from "react";
import { useAccount, useBalance, useWatchAsset } from "wagmi";
import { formatUnits, UserRejectedRequestError } from "viem";
import type { Token } from "@/constants/tokens";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useTokenPrice } from "@/hooks/useTokenPrice";
import { toast } from "sonner";
import Image from "next/image";
import { TransferModal } from "@/components/modals/TransferModal";
import { ApproveModal } from "@/components/modals/ApproveModal";
import { formatCryptoValue } from "@/lib/format";

interface TokenCardProps {
  token: Token;
}

export const TokenCard = ({ token }: TokenCardProps) => {
  const { address } = useAccount();
  const { watchAsset } = useWatchAsset();
  const [showTransfer, setShowTransfer] = useState(false);
  const [showApprove, setShowApprove] = useState(false);

  const {
    priceData,
    isLoading: isLoadingPrice,
    isError: isTokenPriceError,
  } = useTokenPrice(token.coingeckoId);

  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address,
    token: token.address,
  });

  useEffect(() => {
    if (isTokenPriceError) {
      toast.info("Failed to fetch token price");
    }
  }, [isTokenPriceError]);

  const formattedBalance = balanceData
    ? formatUnits(balanceData.value, token.decimals)
    : "0";
  const usdValue =
    priceData?.price && formattedBalance
      ? `≈ ${formatCryptoValue(priceData.price * Number(formattedBalance), true)}`
      : "-";

  const handleAddTokenToWallet = async () => {
    watchAsset(
      {
        type: "ERC20",
        options: {
          address: token.address,
          symbol: token.symbol,
          decimals: token.decimals,
          image: token.logo,
        },
      },
      {
        onSuccess: (wasAdded) => {
          if (wasAdded) {
            toast.success(`${token.symbol} added to wallet!`);
          } else {
            toast.error("Token addition cancelled.");
          }
        },
        onError: (error) => {
          if (error instanceof UserRejectedRequestError) {
            toast.error("You rejected the request in your wallet.");
          } else {
            toast.error("Failed to add token. Is it already in your wallet?");
          }
        },
      },
    );
  };

  return (
    <>
      <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary w-full max-w-xl mx-auto scale-[1.02]">
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
                    ${priceData?.price?.toFixed(2) ?? "-"}
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
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="text-sm font-semibold truncate">
                {formatCryptoValue(Number(formattedBalance || "0"))}{" "}
                {token.symbol}
              </p>
            </div>
            <div className="p-2 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground">Value</p>
              <p className="text-sm font-semibold">{usdValue}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setShowTransfer(true)}
                className="gap-2 hover:cursor-pointer"
                variant="default"
              >
                Transfer
              </Button>

              <Button
                onClick={() => setShowApprove(true)}
                className="gap-2 hover:cursor-pointer"
                variant="secondary"
              >
                Approve
              </Button>
            </div>

            <Button
              onClick={handleAddTokenToWallet}
              variant="outline"
              className="w-full gap-2 hover:cursor-pointer"
            >
              Add to Wallet
            </Button>
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground truncate">
              {token.address}
            </p>
          </div>
        </CardContent>
      </Card>

      {showTransfer && (
        <TransferModal
          token={token}
          balanceData={{ ...balanceData!, formatted: formattedBalance }}
          onRefetchBalance={refetchBalance}
          onClose={() => setShowTransfer(false)}
        />
      )}

      {showApprove && (
        <ApproveModal token={token} onClose={() => setShowApprove(false)} />
      )}
    </>
  );
};
