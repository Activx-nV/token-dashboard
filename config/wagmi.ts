import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia, polygon, arbitrum } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'Token Dashboard',
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID ?? '',
  chains: [mainnet, sepolia, polygon, arbitrum],
  ssr: true,
});
