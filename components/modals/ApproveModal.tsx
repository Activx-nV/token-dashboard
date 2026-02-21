"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useChainId,
} from "wagmi";
import {
  parseUnits,
  formatUnits,
  maxUint256,
  isAddress,
  BaseError,
} from "viem";
import { ERC20_ABI } from "@/constants/abis";
import type { Token } from "@/constants/tokens";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, Info, ExternalLink } from "lucide-react";
import Image from "next/image";
import { getBlockExplorerUrl } from "@/lib/blockchain";
import { toast } from "sonner";
import { UI_AMOUNT_REGEX } from "@/lib/regex";

interface ApproveModalProps {
  token: Token;
  onClose: () => void;
}

export const ApproveModal = ({ token, onClose }: ApproveModalProps) => {
  const { address } = useAccount();
  const chainId = useChainId();

  const notifiedRef = useRef<string | null>(null);
  const [spenderAddress, setSpenderAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<{ spender?: string; amount?: string }>(
    {},
  );

  const { data: currentAllowance = 0n, refetch: refetchAllowance } =
    useReadContract({
      abi: ERC20_ABI,
      address: token.address,
      functionName: "allowance",
      args: [address as `0x${string}`, spenderAddress as `0x${string}`],
      query: {
        enabled: !!address && isAddress(spenderAddress),
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
          error instanceof BaseError ? error.shortMessage : error.message;
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

  const isAlreadySufficient = useMemo(() => {
    if (!amount || amount === "." || !UI_AMOUNT_REGEX.test(amount))
      return false;

    try {
      const parsedAmount = parseUnits(amount, token.decimals);
      return currentAllowance >= parsedAmount;
    } catch {
      return false;
    }
  }, [amount, currentAllowance, token.decimals]);

  useEffect(() => {
    if (!hash || notifiedRef.current === hash) return;

    if (waitError || (isConfirmed && receipt?.status === "reverted")) {
      const msg =
        waitError instanceof BaseError
          ? waitError.shortMessage
          : "Transaction failed on-chain";

      toast.error(msg);

      notifiedRef.current = hash;
    } else if (isConfirmed && receipt?.status === "success") {
      refetchAllowance();

      const explorerUrl = getBlockExplorerUrl(chainId, hash, "tx");

      toast.success(
        <div className="flex items-center gap-2">
          <span>Approval Confirmed!</span>
          <a
            href={explorerUrl}
            target="_blank"
            className="underline flex items-center gap-1"
          >
            View <ExternalLink className="w-3 h-3" />
          </a>
        </div>,
      );

      notifiedRef.current = hash;
    }
  }, [hash, isConfirmed, waitError, receipt, chainId, refetchAllowance]);

  const validateForm = () => {
    const newErrors: { spender?: string; amount?: string } = {};
    if (!isAddress(spenderAddress)) newErrors.spender = "Invalid address";

    const isValidNumeric = UI_AMOUNT_REGEX.test(amount) && amount !== ".";
    if (!amount || !isValidNumeric) newErrors.amount = "Invalid amount";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApprove = () => {
    if (!validateForm()) return;

    if (isAlreadySufficient) {
      toast.info("Allowance is already sufficient.");
      return;
    }

    writeContract({
      abi: ERC20_ABI,
      address: token.address,
      functionName: "approve",
      args: [
        spenderAddress as `0x${string}`,
        parseUnits(amount, token.decimals),
      ],
    });
  };

  const setUnlimitedApproval = () =>
    setAmount(formatUnits(maxUint256, token.decimals));

  if (isConfirmed) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent
          className="sm:max-w-md text-center"
          showCloseButton={false}
        >
          <div className="py-6 flex flex-col items-center gap-4">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
            <DialogTitle>Success!</DialogTitle>
            <p>Allowance updated for {token.symbol}</p>
            <Button onClick={onClose} className="w-full hover:cursor-pointer">
              Finish
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
              width={40}
              height={40}
              className="rounded-full"
            />
            <DialogTitle>Approve {token.symbol}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <fieldset disabled={isPending || isConfirming} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="spender-address">Spender Address</Label>
              <Input
                id="spender-address"
                value={spenderAddress}
                onChange={(e) => setSpenderAddress(e.target.value)}
                placeholder="0x..."
                className={errors.spender ? "border-destructive" : ""}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Amount</Label>
                <button
                  onClick={setUnlimitedApproval}
                  className="text-xs text-blue-500 hover:underline hover:cursor-pointer"
                >
                  Unlimited
                </button>
              </div>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.1"
              />
            </div>
          </fieldset>

          {currentAllowance > 0n && isAddress(spenderAddress) && (
            <Alert variant={isAlreadySufficient ? "default" : "destructive"}>
              <Info className="h-4 w-4" />
              <AlertDescription className="flex justify-between items-center w-full">
                <span className="break-all">
                  Current: {formatUnits(currentAllowance, token.decimals)}
                </span>
                {!isPending && !isConfirming && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      writeContract({
                        abi: ERC20_ABI,
                        address: token.address,
                        functionName: "approve",
                        args: [spenderAddress as `0x${string}`, 0n],
                      });
                    }}
                    className="text-destructive h-6 underline hover:cursor-pointer"
                  >
                    Reset to 0
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleApprove}
            className="w-full hover:cursor-pointer"
            disabled={
              isPending ||
              isConfirming ||
              isAlreadySufficient ||
              !amount ||
              amount === ""
            }
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 animate-spin" /> Confirm in Wallet
              </>
            ) : isConfirming ? (
              <>
                <Loader2 className="mr-2 animate-spin" /> Processing
                Transaction...
              </>
            ) : !amount ? (
              "Enter Amount"
            ) : isAlreadySufficient ? (
              "Allowance Sufficient"
            ) : (
              "Approve"
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
                href={getBlockExplorerUrl(chainId, hash, "tx")}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on Explorer
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          )}

          {(isPending || isConfirming) && (
            <p className="text-xs text-center text-muted-foreground animate-pulse">
              Please do not close this window or refresh the page.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
