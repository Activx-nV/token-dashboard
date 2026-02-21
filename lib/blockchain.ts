export const getBlockExplorerUrl = (
  chainId: number,
  hash: string,
  type: "tx" | "address" | "token" = "tx",
) => {
  const explorers: Record<number, string> = {
    1: "https://etherscan.io",
    11155111: "https://sepolia.etherscan.io",
    42161: "https://arbiscan.io",
    421614: "https://sepolia.arbiscan.io",
    10: "https://optimistic.etherscan.io",
    137: "https://polygonscan.com",
    8453: "https://basescan.org",
    56: "https://bscscan.com",
  };

  const baseUrl = explorers[chainId] || "https://etherscan.io";
  return `${baseUrl}/${type}/${hash}`;
};
