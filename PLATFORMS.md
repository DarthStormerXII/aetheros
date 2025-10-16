# Hedera DeFi Platforms Guide

## 🚀 Transaction Execution with Dual-Mode Support!

This MCP server supports two operation modes controlled by the `EXECUTE_TX` environment variable:

### Mode 1: Prepare Mode (EXECUTE_TX=false) - DEFAULT & SAFER
Perfect for security-conscious users and integration with external signers:
- ✅ Prepares unsigned transactions
- ✅ Returns transaction data for external signing
- ✅ Works with hardware wallets
- ✅ No private key needed - only account ID
- ✅ Zero risk of unauthorized transactions

**Required Configuration:**
```env
EXECUTE_TX=false
HEDERA_OPERATOR_ID=0.0.12345  # Your account ID only
# HEDERA_OPERATOR_KEY not needed!
```

**Example Output:**
```json
{
  "type": "prepared_transaction",
  "description": "Stake 10 HBAR to receive HBARX",
  "from": "0.0.12345",
  "to": "0.0.1027588",
  "value": "1000000000",
  "gas": 200000,
  "unsigned": {
    "contractId": "0.0.1027588",
    "functionName": "stake",
    "functionParams": "",
    "payableAmount": "1000000000"
  },
  "note": "Transaction prepared - sign and submit with your preferred method"
}
```

### Mode 2: Execute Mode (EXECUTE_TX=true)
Full automation with direct transaction execution:
- ✅ Signs and submits transactions
- ✅ Returns transaction IDs
- ✅ Immediate execution
- ⚠️ Requires private key

**Required Configuration:**
```env
EXECUTE_TX=true
HEDERA_OPERATOR_ID=0.0.12345
HEDERA_OPERATOR_KEY=302e020100...  # Private key required
```

### ⚠️ Security Best Practices
1. **Start with Prepare Mode** - Test transaction preparation first
2. **Use dedicated wallets** - Never use your main wallet for automation
3. **Set spending limits** - Implement transaction value caps
4. **Monitor activity** - Track all automated transactions
5. **Testnet first** - Always test on testnet before mainnet

## Platform Availability

| Platform | Mainnet | Testnet | Auth Required | Why Auth? |
|----------|---------|---------|---------------|-----------|
| **Bonzo Finance** | ✅ | ✅ | None | Public REST API |
| **Hashport** | ✅ | ✅ | None | Public REST API |
| **SaucerSwap** | ✅ | ✅ | API key* | Rate limiting |
| **Stader Labs** | ✅ | ❌ | Hedera account** | Contract queries |
| **HeliSwap** | ✅ | ❌ | Hedera account** | Contract queries |

*SaucerSwap requires API key for rate limiting (not publicly available)
**Hedera account needed to query on-chain contracts (no funds required)

## Quick Start

### 1. Minimal Setup (Bonzo + Hashport)
```bash
echo "HEDERA_NETWORK=mainnet" > .env
npm install && npm run build && npm start
```

### 2. With SaucerSwap (after getting API key)
Add to `.env`:
```env
SAUCERSWAP_API_KEY=your-api-key
```

### 3. With Stader/HeliSwap (mainnet only)
Add to `.env`:
```env
HEDERA_OPERATOR_ID=0.0.12345
HEDERA_OPERATOR_KEY=302e020100...
```

## Environment Variables

| Variable | Required | Platforms | Notes |
|----------|----------|-----------|-------|
| `HEDERA_NETWORK` | Yes | All | `mainnet` or `testnet` |
| `SAUCERSWAP_API_KEY` | No | SaucerSwap | Request from team |
| `HEDERA_OPERATOR_ID` | No | Stader, HeliSwap | Your Hedera account |
| `HEDERA_OPERATOR_KEY` | No | Stader, HeliSwap | Your private key |

## Contract Addresses (Reference Only)

**Stader Labs (Mainnet)**
- Staking: `0.0.1027588`
- HBARX Token: `0.0.834116`

**HeliSwap (Mainnet)**
- Factory: `0x0000000000000000000000000000000000134224`
- Router: `0x00000000000000000000000000000000002cc9B2`

## Available Tools

### 📊 Read-Only Tools (No Private Key Required)

#### Always Available
- `bonzo_get_reserves` - View lending pool stats (APY, liquidity, etc.)
- `bonzo_get_account` - Check any account's lending positions
- `bonzo_get_liquidations` - Find accounts eligible for liquidation
- `hashport_get_supported_assets` - List bridgeable assets
- `hashport_get_bridge_quote` - Calculate bridge fees and amounts

#### With SaucerSwap API Key
- `saucerswap_get_quote` - Calculate swap amounts and slippage
- `saucerswap_get_pools` - View liquidity pool reserves
- `saucerswap_get_farms` - Check farming APYs and rewards

#### With Hedera Account (Mainnet Only)
- `stader_get_exchange_rate` - Current HBAR/HBARX exchange rate
- `heliswap_get_pair_info` - View pair reserves and liquidity

### 💸 Transaction Tools (Private Key Required)

#### Currently Implemented
- `stader_stake_hbar` - Stake HBAR to receive HBARX
- `stader_unstake_hbarx` - Unstake HBARX to receive HBAR

#### Coming Soon (See DEFI_OPERATIONS_PLAN.md)
- `saucerswap_execute_swap` - Execute token swaps
- `bonzo_supply_collateral` - Supply assets to lending pool
- `bonzo_borrow_asset` - Borrow from lending pool
- `heliswap_add_liquidity` - Add liquidity to pools
- `hashport_bridge_tokens` - Bridge assets cross-chain

## Getting Credentials

- **Hedera Account**: https://portal.hedera.com/
- **SaucerSwap API**: Request via Discord or website (may take time)
- **Testnet HBAR**: Use Hedera portal faucet