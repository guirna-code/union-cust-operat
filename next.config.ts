import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/programme-electoral/axes/*": ["./chat.md"],
    "/programme-electoral/engagements/*": ["./chat.md"],
  },
};

export default nextConfig;
