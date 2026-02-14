export const TOKENS = {
  1: [
    {
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
      coingeckoId: "usd-coin",
    },
    {
      address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      symbol: "DAI",
      name: "Dai Stablecoin",
      decimals: 18,
      logo: "https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png",
      coingeckoId: "dai",
    },
    {
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
      logo: "https://cryptologos.cc/logos/tether-usdt-logo.png",
      coingeckoId: "tether",
    },
  ],
  11155111: [
    {
      address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
      symbol: "USDC",
      name: "USD Coin (Testnet)",
      decimals: 6,
      logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
      coingeckoId: "usd-coin",
    },
    {
      address: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
      symbol: "USDC",
      name: "USD Coin (Arbitrum Sepolia)",
      decimals: 6,
      logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
      coingeckoId: "usd-coin",
    },
  ],
} as const;

export type Token = {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  logo: string;
  coingeckoId: string;
};
