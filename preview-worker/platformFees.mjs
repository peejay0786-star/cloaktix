/**
 * Server-side platform fee config loader. Not part of the Vite app graph.
 * Returns placeholders until P-Jay supplies PLATFORM_ADA_FEE_ADDRESS.
 */
export function readPlatformFees(env = process.env) {
  const ada = typeof env.PLATFORM_ADA_FEE_ADDRESS === 'string' ? env.PLATFORM_ADA_FEE_ADDRESS.trim() : '';
  return {
    adaFeeAddress: ada || null,
    adaFeeConfigured: !!ada,
    note: ada
      ? 'Platform ADA fee address loaded from server env.'
      : 'PLATFORM_ADA_FEE_ADDRESS not set — P-Jay must provide it before live ADA fee routing.',
  };
}
