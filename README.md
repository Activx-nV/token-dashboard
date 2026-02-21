# Web3 token interactions - notes

> This document covers key concepts, implementation patterns, and lessons learned while building a token management dApp on Ethereum.

> Goal:
> Understand the patterns of writing code that changes the state of the blockchain.
> Get familiar with standards of how to provide good UX both in successful scenarios and especially in relation to error handling.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Wallet Connection](#wallet-connection)
- [Token Card](#token-card)
  - [Token Data & Balances](#token-data--balances)
  - [Token Price (USD)](#token-price-usd)
  - [Adding a Token to the Wallet](#adding-a-token-to-the-wallet)
- [Numbers & Decimals](#numbers--decimals)
  - [Display Practices](#display-practices)
  - [formatCryptoValue Utility](#formatcryptovalue-utility)
- [Error Handling](#error-handling)
  - [Transaction Error Checkpoints](#transaction-error-checkpoints)
- [Token Approval](#token-approval)
  - [What is Approval?](#what-is-approval)
  - [Handling Approval Transactions](#handling-approval-transactions)
  - [Handling Transaction Feedback](#handling-transaction-feedback)
- [Token Transfer](#token-transfer)
  - [Gas Estimation](#gas-estimation)
  - [Form Validation](#form-validation)
  - [useSimulateContract Pattern](#usesimulatecontract-pattern)

---

## Project Overview

It covers the full lifecycle of interacting with ERC-20 tokens from a frontend, including reading balances, fetching prices, estimating gas, approving contracts, and executing transfers.

## Tech stack

- Next.js
- React
- Tailwind
- Shadcn (Radix)
- Rainbowkit
- Wagmi + Viem

Coingecko API - Token price data

Node v24.13.0

## Getting Started

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Build and start production:

```bash
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000)

---

## Wallet Connection

Use the `useAccount` hook from wagmi to track connection state. When the wallet is disconnected, render a fallback component with a user-friendly message inside the `isConnected` condition.

```tsx
const { isConnected, address } = useAccount();

if (!isConnected) {
  return <WalletDisconnectedMessage />;
}
```

Showing loader while isConnected is still undefined & the component is not mounted yet can improve the visual experience.

---

## Token Card

### Token Data & Balances

Demo token data (a list of popular tokens and their metadata) is stored locally in the project. In a production app, this can be fetched dynamically from external APIs such as **Uniswap** or **Coingecko**.

List of tokens on sepolia testnet (both ethereum & arbitrum): **USDC, LINK, UNI**

Token balances are read using the `useBalance` hook, which accepts a wallet address and a token contract address. Omit the token address when querying native ETH.

The hook returns an object with `value`, `decimals`, and a deprecated `formatted` field. Format the value manually instead:

```ts
const formattedBalance = balanceData
  ? formatUnits(balanceData.value, token.decimals)
  : "0";
```

> ⚠️ Avoid `formatEther` for ERC-20 tokens - it hardcodes 18 decimals, which is incorrect for tokens like **USDC** (6 decimals).

### Token Price (USD)

A custom `useTokenPrice` hook fetches the current USD price from the Coingecko API. The request is refreshed every minute to keep prices up to date. The token's Coingecko ID is passed as the `ids` query parameter.

The API returns the price of one token in USD, and optionally the 24-hour price change percentage.

The USD value of the user's holdings is calculated as:

```ts
const usdValue =
  priceData?.price && formattedBalance
    ? `≈ ${formatCryptoValue(priceData.price * Number(formattedBalance), true)}`
    : "-";
```

`formatCryptoValue utility` is explained below.

### Adding a Token to the Wallet

Use wagmi's `useWatchAsset` hook instead of calling `window.ethereum.request` directly. wagmi handles the `window.ethereum` check internally and provides additional benefits: a built-in loading state, multi-wallet support, normalized errors, and lifecycle callbacks (`onSuccess`, `onError`).

---

## Numbers & Decimals

Two core rules for how numbers are handled:

- **Calculations:** Always use full BigInt precision. Never round or truncate during math operations.
- **Display:** Use significant digits in the UI so users never see a misleading `0.00`.

### formatCryptoValue Utility

A single utility function covers all token types:

```ts
export const formatCryptoValue = (num: number, showUSDSymbol = false) => {
  if (isNaN(num) || num === 0) return showUSDSymbol ? "$0.00" : "0.00";

  const formatted = new Intl.NumberFormat(
    undefined,
    num >= 1
      ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
      : { maximumSignificantDigits: 4 },
  ).format(num);

  return showUSDSymbol ? `$${formatted}` : formatted;
};
```

### Function above display

| Asset Value              | Logic Applied                 | Formatting Rule        | Example Output    |
| ------------------------ | ----------------------------- | ---------------------- | ----------------- |
| High Value (`>= 1`)      | `minimumFractionDigits: 2`    | Fixed 2 decimal places | `1,250.00`        |
| Stablecoins (`~= 1`)     | `maximumFractionDigits: 2`    | Fiat-style (USD style) | `$1.50`           |
| Major Assets (`>= 1`)    | `maximumFractionDigits: 2`    | Fixed 2 decimal places | `3,450.12`        |
| Low-Value Tokens (`< 1`) | `maximumSignificantDigits: 4` | 4 significant digits   | `0.00004231`      |
| Zero / NaN               | `isNaN(num) \|\| num === 0`   | Fallback to 0.00       | `0.00` or `$0.00` |

**`minimumFractionDigits`** - Sets the floor. Forces at least N decimal places, padding with zeros if needed. Essential for currencies (e.g., `$10` → `$10.00`).

**`maximumFractionDigits`** - Sets the ceiling. Rounds any digits beyond this limit (e.g., `5.126` → `5.13`). Prevents UI breakage from overly long numbers.

For numbers below `1` (such as gas fees like `0.000045`), `maximumFractionDigits: 2` would produce `0.00`. Switching to `maximumSignificantDigits` solves this by ignoring leading zeros and finding the first meaningful digits.

---

## Error Handling

### Transaction Error Checkpoints

A transaction goes through three distinct stages, each with its own failure mode. Think of it like a rocket launch:

- **Simulate** → Pre-flight check _(Is there fuel? Is the weather okay?)_
- **Write** → Ignition _(Did the pilot press the button? Did the engine start?)_
- **Wait** → Flight _(Did it reach orbit, or explode mid-air?)_

All three should be handled, but with different UI treatments:

| Hook                           | Error Type                                                                    | Recommended UI Treatment                                                          |
| ------------------------------ | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `useSimulateContract`          | **Logic Error** - insufficient balance, contract paused, wrong address        | Inline red text. Disable the submit button so the user can't proceed.             |
| `useWriteContract`             | **User/Wallet Error** - user rejected the signature, wallet disconnected      | Toast notification. Inform the user the transaction was cancelled.                |
| `useWaitForTransactionReceipt` | **On-Chain Error** - slippage exceeded, transaction reverted after being sent | Prominent alert or toast. The user spent gas - this is the most critical failure. |

> 💡 **Tip:** Only show simulation errors when the form has no frontend validation errors, to avoid conflicting messages.

```tsx
{
  !hasFrontendErrors && simulateError && (
    <p className="text-red-500">
      Blockchain Error: {simulateError.shortMessage || "Execution will fail"}
    </p>
  );
}
```

---

## Token Approval

### What is Approval?

Approval grants a smart contract permission to spend your tokens on your behalf. This is required for interactions with DEXs, lending protocols, and other DeFi applications - contracts cannot move tokens from your wallet without explicit permission.

The **spender** is the contract address (e.g., Uniswap's router) being granted this permission.

Current allowance is read using `useReadContract` with the `allowance` function name, passing your address and the spender's address as arguments. Don't forget the `query.enabled` property to prevent unnecessary RPC calls.

### Handling Approval Transactions

The write pattern for approvals uses `useWriteContract` with the `approve` function. The key arguments are the spender's address and the amount to approve in wei (use `parseUnits` with the token's decimals).

**Before submitting, validate:**

- Is the address a valid Ethereum address?
- Has the user entered an amount?
- Is the amount a valid number?

```ts
const isValidNumeric = /^\d*\.?\d*$/.test(amount) && amount !== "."; // Useful regex to check if number is valid
```

**Additional checks:**

- If the current allowance already covers the requested amount, notify the user and prevent a redundant approval.
- **Max allowance** can be set using `formatUnits(maxUint256)` from viem (`2n ** 256n - 1n`).
- **Reset allowance** by calling `writeContract` with `0n` as the amount. Some tokens (notably USDT) require resetting to zero before setting a new value.

**Hook state reference:**

- `isPending` from `useWriteContract` - waiting for the user to confirm in their wallet.
- `isLoading` from `useWaitForTransactionReceipt` - transaction is pending on-chain.
- `isSuccess` from `useWaitForTransactionReceipt` - transaction was confirmed successfully.

### Handling Transaction Feedback

Use mutation callbacks for wallet-level errors and `useEffect` for on-chain results:

```ts
import { BaseError } from "viem";

const {
  writeContract,
  data: hash,
  isPending,
  error: writeError,
  reset,
} = useWriteContract({
  mutation: {
    onError: (error) => {
      const msg =
        error instanceof BaseError ? error.shortMessage : error.message;
      toast.info(msg);
      reset(); // Clear state so the user can try again
    },
  },
});
```

Since `useWaitForTransactionReceipt` has no callbacks, use a `useEffect` with a ref to prevent duplicate notifications:

```ts
const notifiedRef = useRef<string | null>(null);

useEffect(() => {
  if (!hash || notifiedRef.current === hash) return;

  if (waitError || (isSuccess && receipt?.status === "reverted")) {
    const msg = waitError instanceof BaseError
      ? waitError.shortMessage
      : "Transaction failed on-chain";
    toast.error(msg);
    notifiedRef.current = hash;
  } else if (isSuccess && receipt?.status === "success") {
    refetchAllowance();

    const explorerUrl = getBlockExplorerUrl(chainId, hash, "tx");
    toast.success(
      <div className="flex items-center gap-2">
        <span>Approval Confirmed!</span>
        <a href={explorerUrl} target="_blank" className="underline flex items-center gap-1">
          View <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
    notifiedRef.current = hash;
  }
}, [hash, isSuccess, waitError, receipt, chainId, refetchAllowance]);
```

The block explorer URL can be constructed using:

```ts
chain?.blockExplorers?.default?.url; // from useAccount()
// Full URL: `${baseUrl}/tx/${hash}`
```

---

## Token Transfer

### Gas Estimation (UI-only prediction)

A custom `useEthPrice` hook fetches the current ETH price in USD to display the gas cost in fiat.

Gas estimation uses `useEstimateGas`, which requires the transaction `data` as a hex-encoded calldata string. Because the hook is generic and doesn't understand ABIs, use `encodeFunctionData` to produce this:

```ts
encodeFunctionData({
  abi: ERC20_ABI,
  functionName: "transfer",
  args: [recipient, parseUnits(amount || "0", token.decimals)],
});
```

This returns the estimated gas units. The cost in ETH is derived from `useEstimateFeesPerGas`, with an added 20% buffer for reliability:

```ts
const UI_BUFFER = 120n; // 20%

const estimatedGasCost =
  gasUnits && feeData?.maxFeePerGas
    ? (gasUnits * feeData.maxFeePerGas * UI_BUFFER) / 100n
    : 0n;

const gasInEther = formatEther(estimatedGasCost);
const gasInUsd = ethPrice ? ethPrice * Number(gasInEther) : null;

P.S This is just an approximate amount of gas for UI.
```

### Form Validation

Before submitting a transfer, validate all of the following:

- Recipient address is entered
- Recipient is a valid Ethereum address (`isAddress(recipient)`)
- Amount is entered and greater than zero
- Amount does not exceed the user's available balance

### useSimulateContract Pattern

`useSimulateContract` should be used in combination with `useWriteContract` for almost all contract writes. It provides critical benefits:

- **Early error detection** - catches failures like insufficient balance, contract paused, or unauthorized access _before_ the user opens their wallet.
- **Better UX** - the submit button can be disabled with a clear error message if simulation fails.
- **Automatic preparation** - the transaction is pre-built, making the actual write faster and more reliable.

```ts
// isParsable validates if value isn't "1." or ".". Otherwise parseUnits can potentially fail.
const parsedAmount = isParsable ? parseUnits(amount, token.decimals) : 0n;

const isReady =
  !!recipient && isAddress(recipient) && isParsable && parsedAmount > 0n;

const { data, error: simulateError } = useSimulateContract({
  abi: ERC20_ABI,
  address: token.address,
  functionName: "transfer",
  args: [recipient as `0x${string}`, parsedAmount],
  query: {
    enabled: isReady, // Only runs when all conditions are met
  },
});
```

### Gas Estimation (write)

| Argument                   | What it is    | Unit in Code        | How to handle it         | Why?                                                                                              |
| :------------------------- | :------------ | :------------------ | :----------------------- | :------------------------------------------------------------------------------------------------ |
| **`gas`**                  | **Gas Limit** | **Units** (Integer) | **Add a 10%–20% buffer** | Prevents "Out of Gas" failures if the blockchain state changes slightly before the tx is mined.   |
| **`maxFeePerGas`**         | **Max Price** | **Wei** (BigInt)    | **Set to `undefined`**   | Let the **Wallet** (MetaMask/Rabby) use its real-time market data to pick the best current price. |
| **`maxPriorityFeePerGas`** | **Miner Tip** | **Wei** (BigInt)    | **Set to `undefined`**   | Let the **Wallet** decide the "tip" so the transaction doesn't get stuck in the mempool.          |

---

```typescript
const handleTransfer = () => {
  // Check if the simulation run was successful
  if (!simulateData?.request) return;

  writeContract({
    // Spread the original request (address, abi, functionName, args)
    ...simulateData.request,

    // Buffer the Gas Limit (Units) by X% for safety
    gas: simulateData.request.gas
      ? (simulateData.request.gas * 110n) / 100n
      : undefined,

    // Remove price fields to delegate pricing to the wallet
    maxFeePerGas: undefined,
    maxPriorityFeePerGas: undefined,
  });
};
```

`useSimulateContract` catches errors (like Insufficient Balance) before the wallet pop-up appears.

The `110n / 100n` ensures the transaction has 10% extra fuel to reach the destination.

Wallet ensures the user pays the market rate when they click "Confirm."

---

_Notes are useful to recall or learn some of the ideas, that I took away for myself during development._
