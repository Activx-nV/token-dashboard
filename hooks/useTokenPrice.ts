import { useQuery } from "@tanstack/react-query";

interface TokenPrice {
  price?: number;
  priceChange24h?: number;
}

interface CoinGeckoResponse {
  usd?: number;
  usd_24h_change?: number;
}

export const useTokenPrice = (coingeckoId: string) => {
  const {
    data: priceData,
    isLoading,
    isError,
    refetch,
  } = useQuery<TokenPrice>({
    queryKey: ["tokenPrice", coingeckoId],
    queryFn: async () => {
      const url = new URL("https://api.coingecko.com/api/v3/simple/price");
      url.searchParams.append("ids", coingeckoId);
      url.searchParams.append("vs_currencies", "usd");
      url.searchParams.append("include_24hr_change", "true");
      url.searchParams.append(
        "cg_demo_api_key",
        process.env.NEXT_PUBLIC_COINGECKO_API || "",
      );

      const response = await fetch(url);

      if (!response.ok) throw new Error("Failed to fetch price");

      const data: { [coingeckoId]: CoinGeckoResponse } = await response.json();

      return {
        price: data[coingeckoId].usd,
        priceChange24h: data[coingeckoId].usd_24h_change,
      };
    },
    staleTime: 60 * 1000,
  });

  return { priceData, isLoading, isError, refetch };
};
