# Hedera DeFi MCP Server

A Model Context Protocol (MCP) server that provides both **data access** and **transaction execution** capabilities for Hedera DeFi platforms including SaucerSwap, Bonzo Finance, Stader Labs, HeliSwap, and Hashport. 

**🚀 NEW**: Transaction execution now supported! Configure with private key to enable automated DeFi operations.

## Features

### 1. SaucerSwap (DEX)
- Get swap quotes for V1 and V2 pools
- Query liquidity pool information
- Access yield farming opportunities
- Real-time token prices

### 2. Bonzo Finance (Lending/Borrowing)
- View all lending/borrowing reserves
- Check account positions and health factors
- Monitor liquidation opportunities
- Get protocol configuration

### 3. Stader Labs (Liquid Staking)
- Get current HBAR to HBARX exchange rate
- Query staking pool statistics
- Monitor staking rewards

### 4. HeliSwap (DEX)
- Get trading pair information
- Query pool reserves and liquidity
- Calculate swap amounts

### 5. Hashport (Bridge)
- View supported assets across networks
- Get bridge quotes for cross-chain transfers
- Support for 11+ blockchains

## Quick Start

### Mode 1: Read-Only Data Access
Two platforms work immediately without any configuration:
- **Bonzo Finance** - Lending/borrowing data
- **Hashport** - Cross-chain bridge

### Mode 2: Transaction Operations (Dual Mode)
Configure `HEDERA_OPERATOR_ID` to enable transaction features:

#### Prepare Mode (EXECUTE_TX=false) - DEFAULT
- Prepares unsigned transactions for external signing
- **No private key needed** - only account ID
- Perfect for integration with hardware wallets or other signers

#### Execute Mode (EXECUTE_TX=true) 
- Signs and executes transactions directly
- Requires `HEDERA_OPERATOR_KEY` private key
- Full automation capabilities

**Currently Implemented:**
- **Stader Labs** - Stake/unstake HBAR ✅
- More platforms coming soon

See [PLATFORMS.md](./PLATFORMS.md) for complete details and [DEFI_OPERATIONS_PLAN.md](./DEFI_OPERATIONS_PLAN.md) for implementation roadmap.

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/hedera-defi-mcp.git
cd hedera-defi-mcp

# Install dependencies
npm install

# Build the TypeScript code
npm run build

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your API keys and credentials
```

## Configuration

Create a `.env` file with at minimum:

```env
HEDERA_NETWORK=mainnet  # or testnet
```

This gives you immediate access to Bonzo Finance and Hashport. 

For additional platforms, see [PLATFORMS.md](./PLATFORMS.md) for required credentials.

## Usage with MCP Clients

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "hedera-defi": {
      "command": "node",
      "args": ["/path/to/hedera-defi-mcp/dist/index.js"],
      "env": {
        "SAUCERSWAP_API_KEY": "your-api-key",
        "HEDERA_NETWORK": "mainnet"
      }
    }
  }
}
```

### Available Tools

1. **saucerswap_get_quote**
   - Get swap quotes from SaucerSwap V2
   - Parameters: tokenIn, tokenOut, amount, slippageTolerance

2. **saucerswap_get_pools**
   - Get liquidity pool information
   - Parameters: version (v1/v2), token0, token1

3. **saucerswap_get_farms**
   - Get yield farming opportunities
   - Parameters: active (filter for active farms)

4. **bonzo_get_reserves**
   - Get all lending/borrowing reserves
   - No parameters required

5. **bonzo_get_account**
   - Get account lending/borrowing positions
   - Parameters: accountId (e.g., "0.0.123456")

6. **bonzo_get_liquidations**
   - Get accounts eligible for liquidation
   - No parameters required

7. **stader_get_exchange_rate**
   - Get current HBAR to HBARX exchange rate
   - No parameters required

8. **heliswap_get_pair_info**
   - Get trading pair information
   - Parameters: token0, token1

9. **hashport_get_supported_assets**
   - Get list of supported bridge assets
   - Parameters: sourceNetwork, targetNetwork (optional)

10. **hashport_get_bridge_quote**
    - Get bridge transfer quote
    - Parameters: sourceNetworkId, targetNetworkId, sourceAssetId, amount, recipient

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Architecture

The server is built using:
- TypeScript for type safety
- MCP SDK for protocol implementation
- Axios for REST API calls
- Hedera SDK for blockchain interactions
- Ethers.js for smart contract ABIs

## Security Considerations

- Never commit your `.env` file
- Store private keys securely
- Use environment variables for sensitive data
- Consider using a hardware wallet for production

## Error Handling

The server includes comprehensive error handling:
- API rate limiting compliance
- Network error retries
- Detailed error messages
- Graceful client initialization failures

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Documentation

- [Platform Guide](./PLATFORMS.md) - Complete platform information, requirements, and setup

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please open an issue on GitHub.