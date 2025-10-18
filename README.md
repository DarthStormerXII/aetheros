# Hedera DeFi MCP Server

A comprehensive Model Context Protocol (MCP) server that provides unified access to major Hedera DeFi platforms including SaucerSwap, Bonzo Finance, Stader, HeliSwap, and Hashport.

## Overview

This MCP server enables AI assistants and applications to interact with Hedera's DeFi ecosystem through standardized tools. It supports both read-only operations (quotes, balances, reserves) and transaction preparation/execution for DeFi activities.

## Features

- **Multi-platform Support**: Integrates 5 major Hedera DeFi platforms
- **Dynamic Tool Availability**: Only shows tools for configured/available platforms
- **Up to 27 Comprehensive Tools**: Complete coverage of DeFi operations when fully configured
- **Dual Transaction Modes**: Prepare transactions or execute them directly
- **Network Support**: Both mainnet and testnet compatibility
- **Type Safety**: Full TypeScript implementation with Zod validation

## Setup

### Environment Variables

```bash
# Network Configuration
HEDERA_NETWORK=mainnet  # or "testnet"

# Transaction Mode (optional)
EXECUTE_TX=false  # Set to "true" to execute transactions, "false" to prepare only

# Network-specific Hedera Accounts (use appropriate account for selected network)
TESTNET_HEDERA_OPERATOR_ID=0.0.12345   # Required for testnet operations
MAINNET_HEDERA_OPERATOR_ID=0.0.67890   # Required for mainnet operations
TESTNET_HEDERA_OPERATOR_KEY=302...     # Required only when EXECUTE_TX=true on testnet
MAINNET_HEDERA_OPERATOR_KEY=302...     # Required only when EXECUTE_TX=true on mainnet

# Platform API Keys (optional)
SAUCERSWAP_API_KEY=your_api_key  # Required for SaucerSwap operations
```

### Installation

```bash
npm install
npm run build
npm start
```

## Dynamic Tool Availability

The MCP server intelligently shows only the tools that are available based on your environment configuration:

### Tool Availability Matrix

| Platform | Required Environment | Mainnet | Testnet | Tool Count |
|----------|---------------------|---------|---------|-----------|
| **Bonzo Finance** | None (always available) | ✅ | ✅ | 3 |
| **Hashport** | None (always available) | ✅ | ✅ | 10 |
| **SaucerSwap** | `SAUCERSWAP_API_KEY` | ✅ | ✅ | 10 |
| **Stader** | `MAINNET_HEDERA_OPERATOR_ID` | ✅ | ❌ | 3 |
| **HeliSwap** | `MAINNET_HEDERA_OPERATOR_ID` | ✅ | ❌ | 1 |

### Configuration Examples

**Minimal Setup (13 tools):**
```bash
# No additional environment variables needed
# Available: Bonzo Finance (3) + Hashport (10)
```

**With SaucerSwap (23 tools):**
```bash
SAUCERSWAP_API_KEY=your_api_key
# Available: SaucerSwap (10) + Bonzo (3) + Hashport (10)
```

**Full Mainnet Setup (27 tools):**
```bash
HEDERA_NETWORK=mainnet
MAINNET_HEDERA_OPERATOR_ID=0.0.123456
SAUCERSWAP_API_KEY=your_api_key
# Available: All platforms - SaucerSwap (10) + Bonzo (3) + Stader (3) + HeliSwap (1) + Hashport (10)
```

**Testnet with Credentials (23 tools):**
```bash
HEDERA_NETWORK=testnet
TESTNET_HEDERA_OPERATOR_ID=0.0.654321
SAUCERSWAP_API_KEY=your_api_key
# Available: SaucerSwap (10) + Bonzo (3) + Hashport (10)
# Note: Stader and HeliSwap are not available on testnet
```

## Available Tools

### SaucerSwap Tools

SaucerSwap is Hedera's leading AMM DEX providing spot trading and liquidity provision.

#### `saucerswap_get_tokens`
Get all tokens available on SaucerSwap with prices and metadata.

**Parameters:** None

#### `saucerswap_get_stats`
Get SaucerSwap platform statistics including TVL, volume, and SAUCE circulation.

**Parameters:** None

#### `saucerswap_get_sss_stats`
Get Single-Sided Staking (SSS) statistics and XSAUCE ratio.

**Parameters:** None

#### `saucerswap_get_hbar_prices`
Get historical HBAR price data (minutely resolution).

**Parameters:**
- `fromSeconds` (number): Start timestamp in Unix seconds
- `toSeconds` (number): End timestamp in Unix seconds

#### `saucerswap_get_platform_data`
Get historical platform liquidity or volume data with time intervals.

**Parameters:**
- `fromSeconds` (number): Start timestamp in Unix seconds
- `toSeconds` (number): End timestamp in Unix seconds
- `interval` (enum, optional): Data interval - "HOUR", "DAY", or "WEEK" (default: "HOUR")
- `field` (enum, optional): Data type - "LIQUIDITY" or "VOLUME" (default: "LIQUIDITY")

#### `saucerswap_get_farms`
Get list of active yield farming opportunities.

**Parameters:** None

#### `saucerswap_get_farms_by_account`
Get LP token amounts in farms by account ID.

**Parameters:**
- `accountId` (string): Hedera account ID (e.g., "0.0.123456")

#### `saucerswap_get_pools`
Get all liquidity pools with reserves and token information.

**Parameters:** None

#### `saucerswap_get_default_tokens`
Get default listed tokens with hourly, daily, and weekly price changes.

**Parameters:** None

#### `saucerswap_get_v2_pools`
Get SaucerSwap V2 pools with advanced metrics including fees, ticks, and liquidity.

**Parameters:** None

---

### Bonzo Finance Tools

Bonzo Finance is Hedera's decentralized lending and borrowing protocol.

#### `bonzo_get_reserves`
Get all lending/borrowing reserves from Bonzo Finance.

**Parameters:** None

#### `bonzo_get_account`
Get account positions from Bonzo Finance.

**Parameters:**
- `accountId` (string): Hedera account ID (e.g., "0.0.123456")

#### `bonzo_get_liquidations`
Get accounts with outstanding debt eligible for liquidation.

**Parameters:** None

---

### Stader Tools

Stader provides liquid staking for HBAR through HBARX tokens. (Mainnet only)

#### `stader_get_exchange_rate`
Get current HBAR to HBARX exchange rate.

**Parameters:** None

#### `stader_stake_hbar`
Stake HBAR to receive HBARX tokens.

**Parameters:**
- `amountHbar` (string): Amount of HBAR to stake (e.g., "10" for 10 HBAR)

**Behavior:**
- With `EXECUTE_TX=true`: Executes transaction and returns transaction ID
- With `EXECUTE_TX=false`: Returns unsigned transaction for manual signing

#### `stader_unstake_hbarx`
Unstake HBARX to receive HBAR.

**Parameters:**
- `amountHbarx` (string): Amount of HBARX to unstake in smallest unit

**Behavior:**
- With `EXECUTE_TX=true`: Executes transaction and returns transaction ID
- With `EXECUTE_TX=false`: Returns unsigned transaction for manual signing

---

### HeliSwap Tools

HeliSwap is a decentralized exchange on Hedera. (Mainnet only)

#### `heliswap_get_pair_info`
Get trading pair information from HeliSwap.

**Parameters:**
- `token0` (string): First token address
- `token1` (string): Second token address

---

### Hashport Tools

Hashport is Hedera's cross-chain bridge protocol enabling asset transfers between networks.

#### `hashport_get_supported_assets`
Get list of assets supported by Hashport bridge.

**Parameters:**
- `sourceNetwork` (string, optional): Source network ID
- `targetNetwork` (string, optional): Target network ID

#### `hashport_get_supported_networks`
Get all networks supported by Hashport.

**Parameters:** None

#### `hashport_get_bridge_steps`
Get step-by-step instructions for bridging assets via Hashport.

**Parameters:**
- `sourceNetworkId` (string): Source network ID
- `targetNetworkId` (string): Target network ID
- `sourceAssetId` (string): Asset ID on source network
- `recipient` (string): Recipient address on target network
- `amount` (string, optional): Amount to bridge
- `tokenId` (string, optional): Token ID for NFTs

#### `hashport_validate_bridge`
Validate bridge parameters before initiating a bridge.

**Parameters:**
- `sourceNetworkId` (string): Source network ID
- `targetNetworkId` (string): Target network ID
- `sourceAssetId` (string): Asset ID on source network
- `recipient` (string): Recipient address on target network
- `amount` (string, optional): Amount to bridge
- `tokenId` (string, optional): Token ID for NFTs

#### `hashport_get_assets_amounts`
Get reserve amounts for all assets on Hashport.

**Parameters:** None

#### `hashport_get_transfers`
Get paginated list of transfers with optional filtering.

**Parameters:**
- `page` (number): Page number (starts from 1)
- `pageSize` (number): Page size (max 50)
- `filter` (object, optional):
  - `originator` (string, optional): Originator address/account ID
  - `timestamp` (string, optional): Timestamp in RFC3339Nano format
  - `tokenId` (string, optional): Token ID or token address
  - `transactionId` (string, optional): Transaction ID or transaction hash

#### `hashport_get_network_assets`
Get assets available on a specific network.

**Parameters:**
- `networkId` (string): Network ID

#### `hashport_get_network_asset_amounts`
Get amounts for a specific asset on a network.

**Parameters:**
- `networkId` (string): Network ID
- `assetId` (string): Asset ID

#### `hashport_get_network_asset_details`
Get detailed information for a specific asset on a network.

**Parameters:**
- `networkId` (string): Network ID
- `assetId` (string): Asset ID

#### `hashport_convert_hedera_tx_id`
Convert Hedera transaction ID format.

**Parameters:**
- `txId` (string): Hedera transaction ID to convert

## Transaction Modes

### Preparation Mode (Default)
- Set `EXECUTE_TX=false` or omit the environment variable
- Returns unsigned transactions that can be signed and submitted manually
- Requires only network-specific operator ID (`TESTNET_HEDERA_OPERATOR_ID` or `MAINNET_HEDERA_OPERATOR_ID`)
- Safer for production use

### Execution Mode
- Set `EXECUTE_TX=true`
- Automatically signs and submits transactions to the network
- Requires both network-specific operator ID and private key (`TESTNET_HEDERA_OPERATOR_KEY` or `MAINNET_HEDERA_OPERATOR_KEY`)
- Returns transaction IDs upon successful execution
- ⚠️ **Warning**: Private key is loaded in memory

## Network Compatibility

| Platform | Mainnet | Testnet |
|----------|---------|---------|
| SaucerSwap | ✅ | ✅ |
| Bonzo Finance | ✅ | ✅ |
| Stader | ✅ | ❌ |
| HeliSwap | ✅ | ❌ |
| Hashport | ✅ | ✅ |

## Error Handling

The server includes comprehensive error handling:

- **Missing Dependencies**: Clear error messages when required services aren't initialized
- **Invalid Parameters**: Zod schema validation with detailed error descriptions
- **Network Errors**: Proper error propagation from underlying APIs
- **Transaction Failures**: Detailed error information for failed transactions

## Development

```bash
# Development mode with hot reload
npm run dev

# Build TypeScript
npm run build

# Watch mode
npm run watch
```

## Security Considerations

- **Private Key Management**: Only load private keys when `EXECUTE_TX=true`
- **Environment Variables**: Store sensitive data in environment variables
- **Transaction Validation**: All parameters are validated before processing
- **Network Isolation**: Separate mainnet and testnet configurations

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
- Create an issue in the GitHub repository
- Check existing documentation for common solutions
- Review error messages for specific guidance