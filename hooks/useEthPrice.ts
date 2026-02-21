import { useQuery } from "@tanstack/react-query";

export const useEthPrice = () => {
  return useQuery<number>({
    queryKey: ["ethPrice"],
    queryFn: async () => {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&cg_demo_api_key=${process.env.NEXT_PUBLIC_COINGECKO_API}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch ETH price");
      }

      const data = await response.json();
      return data.ethereum.usd;
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });
};
