import { encodeFunctionData, parseUnits } from "viem";
import { ERC20_ABI } from "@/constants/abis";
import type { Token } from "@/constants/tokens";

export const buildErc20TransferCalldata = (
  token: Token,
  recipient: `0x${string}`,
  amount: string,
) => {
  return encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "transfer",
    args: [recipient, parseUnits(amount || "0", token.decimals)],
  });
};

