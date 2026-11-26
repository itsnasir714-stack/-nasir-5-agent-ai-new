
const REQUIRED_CHECKS = [
  "mintAuthorityRevoked",
  "freezeAuthorityRevoked",
  "liquidityLocked",
  "ownershipChecked"
];

function checkTokenSafety(token) {
  const missingChecks = REQUIRED_CHECKS.filter(
    check => token?.[check] !== true
  );

  return {
    agent: "Safety Agent",
    token: token?.address || "Unknown",
    status: "UNVERIFIED",
    missingChecks,
    eligibleForPaperAnalysis: Boolean(token?.address),
    eligibleForPaperTrading: false,
    realTrading: false,
    message:
      "Independent on-chain safety verification is not implemented. Trading remains blocked."
  };
}

export {
  checkTokenSafety,
  REQUIRED_CHECKS
};
