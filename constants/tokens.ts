export const TOKENS = {
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
      address: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
      symbol: "LINK",
      name: "Chainlink Token",
      decimals: 18,
      logo: "https://cryptologos.cc/logos/chainlink-link-logo.png",
      coingeckoId: "chainlink",
    },
    {
      address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      symbol: "UNI",
      name: "Uniswap",
      decimals: 18,
      logo: "https://cryptologos.cc/logos/uniswap-uni-logo.png",
      coingeckoId: "uniswap",
    },
  ],
  421614: [
    {
      address: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
      symbol: "USDC",
      name: "USD Coin (Arbitrum Sepolia)",
      decimals: 6,
      logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
      coingeckoId: "usd-coin",
    },
    {
      address: "0xb1D4538B4571d411F07960EF2838Ce337FE1E80E",
      symbol: "LINK",
      name: "Chainlink Token",
      decimals: 18,
      logo: "https://cryptologos.cc/logos/chainlink-link-logo.png",
      coingeckoId: "chainlink",
    },
    {
      address: "0x4064DcC3A9DE3e8b8DE6C080740f1dEa7b1afF63",
      symbol: "UNI",
      name: "Uniswap",
      decimals: 18,
      logo: "https://cryptologos.cc/logos/uniswap-uni-logo.png",
      coingeckoId: "uniswap",
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
