/**
 * LAX: Allows "1." or "0."
 * Best for: Form validation / showing UI error messages
 */
export const UI_AMOUNT_REGEX = /^\d*\.?\d*$/;

/**
 * STRICT: Rejects "1." or "." (Requires at least one digit at the end)
 * Best for: parseUnits() and useSimulateContract enabled checks.
 * E.g useSimulateContract hook will run only if regex is matched, preventing unnecessary RPC calls and errors in console.
 */
export const PARSABLE_AMOUNT_REGEX = /^\d*\.?\d+$/;
