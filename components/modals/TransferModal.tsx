"use client";

import { useEffect, useRef, useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSimulateContract,
  useEstimateGas,
  useEstimateFeesPerGas,
  useChainId,
} from "wagmi";
import {
  parseUnits,
  isAddress,
  formatEther,
  BaseError,
  formatUnits,
} from "viem";
import { ERC20_ABI } from "@/constants/abis";
import type { Token } from "@/constants/tokens";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { getBlockExplorerUrl } from "@/lib/blockchain";
import { useEthPrice } from "@/hooks/useEthPrice";
import { useTokenPrice } from "@/hooks/useTokenPrice";
import { formatCryptoValue } from "@/lib/format";
import { buildErc20TransferCalldata } from "@/lib/web3";
import { PARSABLE_AMOUNT_REGEX, UI_AMOUNT_REGEX } from "@/lib/regex";

interface TransferModalProps {
  token: Token;
  balanceData?: {
    decimals: number;
    formatted: string;
    symbol: string;
    value: bigint;
  };
  onRefetchBalance: () => void;
  onClose: () => void;
}

export const TransferModal = ({
  token,
  balanceData,
  onRefetchBalance,
  onClose,
}: TransferModalProps) => {
  const notifiedRef = useRef<string | null>(null);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<{ recipient?: string; amount?: string }>(
    {},
  );

  const { address: userAddress } = useAccount();
  const chainId = useChainId();

  const { data: ethPrice, isLoading: isPriceLoading } = useEthPrice();
  const {
    priceData,
    isLoading,
    isError: isTokenPriceError,
  } = useTokenPrice(token.coingeckoId);

  const hasFrontendErrors = Object.keys(errors).length > 0;

  const isValidForUI =
    UI_AMOUNT_REGEX.test(amount) && amount !== "." && amount !== "";
  const isParsable = PARSABLE_AMOUNT_REGEX.test(amount);
  const parsedAmount = isParsable ? parseUnits(amount, token.decimals) : 0n;
  const isReady =
    !!recipient && isAddress(recipient) && isParsable && parsedAmount > 0n;

  const { data, error: simulateError } = useSimulateContract({
    abi: ERC20_ABI,
    address: token.address,
    functionName: "transfer",
    args: [recipient as `0x${string}`, parsedAmount],
    query: {
      enabled: isReady,
    },
  });

  const {
    writeContract,
    data: hash,
    isPending,
    reset,
  } = useWriteContract({
    mutation: {
      onError: (error) => {
        const msg =
          error instanceof BaseError
            ? error.shortMessage
            : error.message || "Transaction failed";

        toast.info(msg);
        reset();
      },
    },
  });

  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: waitError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isConfirmed) {
      onRefetchBalance();
    }
  }, [isConfirmed, onRefetchBalance]);

  useEffect(() => {
    if (!hash || notifiedRef.current === hash) return;

    if (waitError || (isConfirmed && receipt?.status === "reverted")) {
      toast.error("Transaction failed on-chain.");
      notifiedRef.current = hash;
    }

    if (isConfirmed && receipt?.status === "success") {
      const explorerUrl = getBlockExplorerUrl(chainId, hash, "tx");

      toast.success(
        <div className="flex items-center gap-2">
          <span>Transfer successful!</span>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 underline font-semibold hover:text-blue-600"
            onClick={(e) => e.stopPropagation()}
          >
            View
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>,
        {
          duration: 8000,
        },
      );
      notifiedRef.current = hash;
    }
  }, [hash, isConfirmed, waitError, receipt, chainId]);

  const transferData =
    recipient && amount && isAddress(recipient)
      ? buildErc20TransferCalldata(token, recipient as `0x${string}`, amount)
      : undefined;

  const { data: gasUnits } = useEstimateGas({
    account: userAddress,
    to: token.address as `0x${string}`,
    data: transferData,
    value: 0n,
    query: {
      enabled: !!transferData && !!userAddress,
    },
  });

  const { data: feeData } = useEstimateFeesPerGas();
  const pricePerUnit = feeData?.maxFeePerGas ?? 0n;

  const UI_BUFFER = 120n; // 20%

  const estimatedGasCost =
    gasUnits && pricePerUnit
      ? (gasUnits * pricePerUnit * UI_BUFFER) / 100n
      : 0n;

  const gasInEther = formatEther(estimatedGasCost);
  const gasInUsdRaw =
    ethPrice && estimatedGasCost > 0n ? Number(gasInEther) * ethPrice : 0;

  const validateForm = () => {
    const newErrors: { recipient?: string; amount?: string } = {};

    if (!recipient) {
      newErrors.recipient = "Recipient address is required";
    } else if (!isAddress(recipient)) {
      newErrors.recipient = "Invalid Ethereum address";
    }

    if (!amount || amount === "") {
      newErrors.amount = "Amount is required";
    } else if (!isValidForUI) {
      newErrors.amount = "Invalid amount format";
    } else {
      const amountBigInt = parseUnits(amount, token.decimals);
      const balanceBigInt = balanceData?.value || 0n;

      if (amountBigInt <= 0n) {
        newErrors.amount = "Amount must be greater than 0";
      } else if (amountBigInt > balanceBigInt) {
        newErrors.amount = "Insufficient balance";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTransfer = () => {
    if (!validateForm() || !data?.request) return;

    writeContract({
      ...data.request,
      gas: data.request.gas ? (data.request.gas * 110n) / 100n : undefined,
      maxFeePerGas: undefined,
      maxPriorityFeePerGas: undefined,
    });
  };

  useEffect(() => {
    if (isTokenPriceError) {
      toast.info("Failed to fetch token price");
    }
  }, [isTokenPriceError]);

  const isTransferDisabled =
    isPending ||
    isConfirming ||
    !data?.request ||
    !!simulateError ||
    !recipient ||
    !amount;

  if (isConfirmed) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center space-y-4 py-6">
            <div className="p-4 bg-green-100 rounded-full">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <div>
              <DialogTitle className="text-2xl mb-2">
                Transfer Successful!
              </DialogTitle>
              <DialogDescription>
                Your {amount} {token.symbol} has been sent
              </DialogDescription>
            </div>
            <Button onClick={onClose} className="w-full hover:cursor-pointer">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open && !isConfirming && !isPending) {
          onClose();
        }
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => {
          if (isConfirming || isPending) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (isConfirming || isPending) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Image
              src={token.logo}
              alt={token.symbol}
              className="w-10 h-10 rounded-full"
              width={40}
              height={40}
            />
            <div>
              <DialogTitle>Transfer {token.symbol}</DialogTitle>
              <DialogDescription>
                {formatCryptoValue(Number(balanceData?.formatted || "0"))}{" "}
                {token.symbol}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              value={recipient}
              onChange={(e) => {
                setRecipient(e.target.value);
                setErrors({ ...errors, recipient: undefined });
              }}
              placeholder="0x..."
              className={errors.recipient ? "border-destructive" : ""}
            />
            {errors.recipient && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.recipient}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount">Amount</Label>
              {balanceData && balanceData.value > 0n && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setAmount(balanceData.formatted);
                    setErrors({});
                  }}
                  className="h-auto p-0 hover:cursor-pointer"
                >
                  MAX
                </Button>
              )}
            </div>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setErrors({ ...errors, amount: undefined });
                }}
                placeholder="0.01"
                step="0.01"
                className={errors.amount ? "border-destructive pr-20" : "pr-20"}
              />
              <Badge
                variant="secondary"
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {token.symbol}
              </Badge>
            </div>

            {errors.amount && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.amount}
              </p>
            )}

            {amount && parseFloat(amount) > 0 && !errors.amount && (
              <p className="text-sm text-muted-foreground">
                {isLoading
                  ? "Loading price..."
                  : priceData?.price
                    ? `≈ ${formatCryptoValue(
                        priceData.price * Number(amount),
                        true,
                      )}`
                    : "Price unavailable"}
              </p>
            )}
          </div>

          <Alert>
            <AlertDescription className="flex justify-between text-sm flex-col">
              <div className="flex gap-3 text-sm text-muted-foreground">
                <span>Estimated Gas:</span>
                <span className="font-semibold text-foreground">
                  {gasUnits ? (
                    `~${formatCryptoValue(Number(gasInEther))} ETH`
                  ) : !isReady || balanceData?.value === 0n ? (
                    "N/A"
                  ) : (
                    <span className="animate-pulse">Calculating...</span>
                  )}
                </span>
              </div>
              {isPriceLoading ? (
                <div className="text-xs text-muted-foreground">
                  Loading price...
                </div>
              ) : gasInUsdRaw ? (
                <div className="text-xs text-muted-foreground">
                  ≈ ${formatCryptoValue(gasInUsdRaw)} USD
                </div>
              ) : null}
            </AlertDescription>
          </Alert>

          {!hasFrontendErrors && simulateError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm break-all max-w-full">
                {simulateError instanceof BaseError
                  ? simulateError.shortMessage
                  : "Transfer will failed"}
              </AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertDescription className="text-xs">
              <strong>NB!</strong>
              <i>
                Double-check the recipient address. Transactions cannot be
                reversed.
              </i>
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleTransfer}
            disabled={isTransferDisabled}
            className="w-full gap-2 hover:cursor-pointer"
            size="lg"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Confirm in Wallet...
              </>
            ) : isConfirming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Transfer Tokens"
            )}
          </Button>
          {hash && (
            <Button
              asChild
              variant="outline"
              className="w-full gap-2 hover:cursor-pointer"
              size="lg"
            >
              <a
                href={getBlockExplorerUrl(chainId, hash!, "tx")}
                target="_blank"
                rel="noopener noreferrer"
                className={!hash ? "pointer-events-none" : ""}
              >
                View on Explorer
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
