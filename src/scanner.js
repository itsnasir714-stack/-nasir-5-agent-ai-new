const API =
  "https://api.dexscreener.com/token-profiles/latest/v1";

const RULES = {
  minLiquidity: 50000,
  minVolume24h: 50000,
  minAgeDays: 1,
  minChange24h: -20,
  maxChange24h: 100
};

async function scanSolanaTokens() {
  const response = await fetch(API);

  if (!response.ok) {
    throw new Error("Scanner API unavailable");
  }

  const profiles = await response.json();

  if (!Array.isArray(profiles)) {
    throw new Error("Invalid scanner response");
  }

  const tokens = profiles.filter(
    token =>
      token &&
      token.chainId === "solana" &&
      typeof token.tokenAddress === "string"
  ).slice(0, 30);

  const results = [];
  const seen = new Set();

  for (const token of tokens) {
    const url =
      "https://api.dexscreener.com/latest/dex/tokens/" +
      encodeURIComponent(token.tokenAddress);

    const res = await fetch(url);

    if (!res.ok) continue;

    const data = await res.json();

    for (const pair of data.pairs || []) {
      if (
        pair.chainId !== "solana" ||
        !pair.baseToken?.address
      ) continue;

      const address = pair.baseToken.address;

      if (seen.has(address)) continue;

      const liquidity = Number(pair.liquidity?.usd);
      const volume = Number(pair.volume?.h24);
      const change = Number(pair.priceChange?.h24);
      const price = Number(pair.priceUsd);

      const age = pair.pairCreatedAt
        ? (Date.now() - Number(pair.pairCreatedAt)) /
          86400000
        : 0;

      if (
        !Number.isFinite(liquidity) ||
        !Number.isFinite(volume) ||
        !Number.isFinite(change) ||
        !Number.isFinite(price) ||
        !Number.isFinite(age) ||
        price <= 0
      ) continue;

      seen.add(address);

      results.push({
        name: pair.baseToken.name || "Unknown",
        symbol: pair.baseToken.symbol || "Unknown",
        address,
        priceUsd: price,
        liquidityUsd: liquidity,
        volume24hUsd: volume,
        ageDays: Number(age.toFixed(2)),
        change24h: change,
        eligible:
          liquidity >= RULES.minLiquidity &&
          volume >= RULES.minVolume24h &&
          age >= RULES.minAgeDays &&
          change >= RULES.minChange24h &&
          change <= RULES.maxChange24h,
        safetyVerified: false,
        mode: "PAPER_ONLY"
      });
    }
  }

  return results;
}

export { scanSolanaTokens, RULES };
