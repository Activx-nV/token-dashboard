import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cryptologos.cc",
        port: "",
        pathname: "/logos/**",
      },
    ],
  },
};

export default nextConfig;
