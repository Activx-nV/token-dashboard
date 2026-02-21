import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { arbitrumSepolia, sepolia } from "wagmi/chains";
import { http } from "wagmi";

export const wagmiConfig = getDefaultConfig({
  appName: "ERC-20 Token Actions",
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID ?? "",
  chains: [sepolia, arbitrumSepolia],
  ssr: true,
  transports: {
    [sepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
});
