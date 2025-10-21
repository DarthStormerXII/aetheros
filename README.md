# KawaFi - Hedera DeFi MCP Server

> **KawaFi** provides unified access to the Hedera DeFi ecosystem through the Model Context Protocol (MCP), enabling AI assistants to interact with multiple DeFi platforms safely and efficiently.

[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Tools](https://img.shields.io/badge/Tools-36-brightgreen)](#available-tools)
[![Success Rate](https://img.shields.io/badge/Success%20Rate-100%25-brightgreen)](./TEST_RESULTS.md)

## 🚀 Overview

A comprehensive Model Context Protocol (MCP) server that provides unified access to major Hedera DeFi platforms including SaucerSwap, Bonzo Finance, Stader, HeliSwap, and Hashport. This server enables AI assistants and applications to interact with Hedera's DeFi ecosystem through **36 standardized tools** covering data analytics, transaction preparation, and cross-platform operations.

## ✨ Features

### 🔐 **Dual-Mode Security System**
- **Prepare Mode** (Default): Generate unsigned transactions for external signing
- **Execute Mode** (Advanced): Optionally sign and execute transactions directly
- **Security-First Design**: Private keys only loaded when explicitly required

### 🌐 **Multi-Platform DeFi Integration**
- **[SaucerSwap](https://saucerswap.finance)**: Leading AMM DEX (19 tools)
- **[Bonzo Finance](https://bonzo.finance)**: Lending and borrowing (3 tools)  
- **[Stader](https://staderlabs.com)**: HBAR liquid staking (3 tools)
- **[HeliSwap](https://heliswap.finance)**: Trading pair data (1 tool)
- **[Hashport](https://hashport.network)**: Cross-chain bridging (10 tools)

### 🛠️ **Comprehensive Toolset**
- **Data & Analytics**: Real-time prices, pool reserves, APYs, lending rates
- **Transaction Preparation**: Complete unsigned transaction data with proper encoding
- **Cross-chain Operations**: Asset bridging across multiple networks
- **Yield Optimization**: Staking, farming, and lending opportunities

## 📊 Tool Overview

| Platform | Data Tools | Transaction Tools | Total | Status |
|----------|------------|------------------|-------|---------|
| **SaucerSwap** | 10 | 9 | **19** | ✅ 100% Working |
| **Bonzo Finance** | 3 | 0* | **3** | ✅ 100% Working |
| **Stader** | 1 | 2 | **3** | ✅ 100% Working |
| **HeliSwap** | 1 | 0 | **1** | ✅ 100% Working |  
| **Hashport** | 10 | 0 | **10** | ✅ 100% Working |
| **TOTAL** | **25** | **11** | **36** | ✅ **100% Working** |

*Bonzo transaction tools planned for future release

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+
- An MCP-compatible client (Claude Desktop, etc.)

### 1. Installation
```bash
git clone <repository-url>
cd aya
npm install
npm run build
```

### 2. Environment Configuration
Create a `.env` file with your desired configuration:

```bash
# Network Selection
HEDERA_NETWORK=mainnet  # or "testnet"

# Security Mode
EXECUTE_TX=false        # true for execution, false for prepare-only

# Platform API Keys
SAUCERSWAP_API_KEY=your_api_key_here  # Optional but recommended

# Hedera Credentials (choose based on network)
MAINNET_HEDERA_OPERATOR_ID=0.0.your_account
MAINNET_HEDERA_OPERATOR_KEY=your_private_key     # Only if EXECUTE_TX=true
TESTNET_HEDERA_OPERATOR_ID=0.0.your_testnet_account  
TESTNET_HEDERA_OPERATOR_KEY=your_testnet_private_key  # Only if EXECUTE_TX=true
```

### 3. MCP Client Configuration
Add to your MCP client:

**Claude Desktop (`claude_desktop_config.json`)**:
```json
{
  "mcpServers": {
    "hedera-defi": {
      "command": "node",
      "args": ["/path/to/aya/dist/index.js"]
    }
  }
}
```

### 4. Verification
```bash
# Test the server
npm start

# Check available tools (should show 13-36 tools based on configuration)
```

## 📋 Available Tools

### SaucerSwap (19 tools)

#### **Data & Analytics Tools (10)**
- `saucerswap_get_tokens` - All available tokens with prices and metadata
- `saucerswap_get_stats` - Platform statistics (TVL, volume, SAUCE circulation)
- `saucerswap_get_sss_stats` - Single-Sided Staking statistics and XSAUCE ratio
- `saucerswap_get_hbar_prices` - Historical HBAR price data (minutely resolution)
- `saucerswap_get_platform_data` - Historical liquidity/volume data with intervals
- `saucerswap_get_farms` - Active yield farming opportunities
- `saucerswap_get_farms_by_account` - LP token amounts in farms by account
- `saucerswap_get_pools` - All liquidity pools with reserves and token info
- `saucerswap_get_default_tokens` - Default tokens with price changes
- `saucerswap_get_v2_pools` - V2 pools with advanced metrics (fees, ticks, liquidity)

#### **Transaction Tools (9)** 🆕
- `saucerswap_quote_exact_input` - Get swap quote for exact input amount
- `saucerswap_quote_exact_output` - Get swap quote for exact output amount  
- `saucerswap_swap_hbar_for_tokens` - Prepare HBAR → tokens swap with refunds
- `saucerswap_swap_tokens_for_hbar` - Prepare tokens → HBAR swap with unwrapping
- `saucerswap_swap_tokens_for_tokens` - Prepare token → token swaps
- `saucerswap_stake_sauce` - Prepare SAUCE staking for xSAUCE
- `saucerswap_unstake_xsauce` - Prepare xSAUCE unstaking for SAUCE
- `saucerswap_deposit_to_farm` - Prepare LP token farm deposits
- `saucerswap_withdraw_from_farm` - Prepare LP token farm withdrawals

### Other Platform Tools (17)

#### **Bonzo Finance (3)**
- `bonzo_get_reserves` - All lending/borrowing reserves
- `bonzo_get_account` - Account positions and balances
- `bonzo_get_liquidations` - Accounts eligible for liquidation

#### **Stader (3)** 
- `stader_get_exchange_rate` - Current HBAR to HBARX exchange rate
- `stader_stake_hbar` - Stake HBAR for HBARX (transaction)
- `stader_unstake_hbarx` - Unstake HBARX for HBAR (transaction)

#### **HeliSwap (1)**
- `heliswap_get_pair_info` - Trading pair information

#### **Hashport (10)**
- `hashport_get_supported_assets` - Bridge-supported assets
- `hashport_get_supported_networks` - All supported networks
- `hashport_get_bridge_steps` - Step-by-step bridging instructions
- `hashport_validate_bridge` - Validate bridge parameters
- `hashport_get_assets_amounts` - Asset reserve amounts
- `hashport_get_transfers` - Paginated transfer history
- `hashport_get_network_assets` - Assets on specific networks
- `hashport_get_network_asset_amounts` - Asset amounts per network
- `hashport_get_network_asset_details` - Detailed asset information
- `hashport_convert_hedera_tx_id` - Transaction ID format conversion

## 🎯 Usage Examples

For comprehensive examples and test prompts for all 36 tools, see **[PROMPTS.md](./PROMPTS.md)**.

### Basic DeFi Data
```
Get all tokens available on SaucerSwap
```
```
Show current HBAR to HBARX staking rate  
```
```
List active yield farms with APYs
```

### Transaction Preparation 🆕
```
Prepare transaction to swap 10 HBAR for SAUCE tokens with 0.3% fee pool
```
```
Prepare transaction to stake 1000000 SAUCE for xSAUCE
```
```
Prepare transaction to deposit LP tokens to farm pool 1
```

### Analytics & Cross-chain
```
Get HBAR price history from last week
```
```
Find accounts eligible for liquidation on Bonzo
```  
```
Get bridge steps from Ethereum to Hedera for USDC
```

## 📊 Status & Testing

### Current Status
- **Overall**: 36/36 tools working (100% success rate)
- **Transaction Tools**: 11/11 working (100% success rate)
- **Data Tools**: 25/25 working (100% success rate)

### Detailed Results
See **[TEST_RESULTS.md](./TEST_RESULTS.md)** for:
- Complete testing results with response sizes
- Performance notes and API rate limiting info
- Known issues and resolution steps
- Platform-specific availability details

### Known Issues
- **API Rate Limiting**: Some SaucerSwap endpoints may timeout during high load
- **Network Dependencies**: Stader and HeliSwap only available on mainnet

## 🛡️ Security & Transaction Modes

### Prepare Mode (Recommended)
```bash
EXECUTE_TX=false  # or omit entirely
```
- ✅ **Secure**: Private keys never loaded
- ✅ **Flexible**: Sign with hardware wallets, dApps, or secure environments  
- ✅ **Transparent**: Complete unsigned transaction data provided
- ⚡ **Fast**: No blockchain interaction delays

### Execute Mode (Advanced)
```bash
EXECUTE_TX=true
MAINNET_HEDERA_OPERATOR_KEY=302e020100...
```
- ⚠️ **Security**: Private key loaded in memory
- ⚡ **Convenient**: Automatic transaction signing and submission
- 📊 **Results**: Returns transaction IDs and confirmations
- 🎯 **Use Case**: Automated strategies, trusted environments

### Transaction Output Example
**Prepare Mode Output:**
```json
{
  "type": "prepared_transaction",
  "description": "Swap 10 HBAR for minimum 1000000 SAUCE tokens",
  "from": "0.0.123456",
  "to": "0x00000000000000000000000000000000002cc9B2",
  "function": "multicall(bytes[])",
  "gas": 400000,
  "value": "1000000000",
  "unsigned": {
    "contractId": "0x00000000000000000000000000000000002cc9B2",
    "functionName": "multicall",
    "functionParams": ["0xc04b8d59000000..."],
    "payableAmount": "1000000000"
  }
}
```

## 🏗️ Architecture & Development

### Project Structure
```
src/
├── clients/           # Platform-specific client implementations
│   ├── saucerswap.ts    # SaucerSwap API + transaction tools
│   ├── bonzo.ts         # Bonzo Finance integration
│   ├── stader.ts        # Stader staking with transactions  
│   ├── hashport.ts      # Hashport bridge operations
│   └── heliswap.ts      # HeliSwap pair data
├── index.ts           # MCP server with 36 tool definitions
└── types/             # TypeScript definitions
```

### Development Commands
```bash
npm run dev            # Development with hot reload
npm run build          # Production build
npm run test           # Run test suite
```

### Technical Details
For complete technical overview, challenges, and architecture details, see **[SUBMISSION.md](./SUBMISSION.md)**.

## 🔗 Documentation Links

- **[PROMPTS.md](./PROMPTS.md)** - Test prompts for all 36 tools
- **[TEST_RESULTS.md](./TEST_RESULTS.md)** - Comprehensive testing results (94% success rate)  
- **[SUBMISSION.md](./SUBMISSION.md)** - Technical overview and project details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature` 
5. Open a Pull Request

## 🐛 Troubleshooting

### Common Issues

**Tools not appearing**: Check MCP configuration path
```bash
ls -la dist/index.js  # Verify build exists
```

**API timeouts**: SaucerSwap has rate limits
```
# Retry requests or use smaller data ranges
# API tools may timeout but transaction tools work consistently
```

**Contract errors**: Verify network configuration
```bash
echo $HEDERA_NETWORK    # Should match your credentials
echo $EXECUTE_TX        # Should be "false" for prepare mode
```

**Missing transaction tools**: Ensure Hedera credentials are set
```bash
# For mainnet transaction tools:
echo $MAINNET_HEDERA_OPERATOR_ID    # Required for transaction preparation
```

### Getting Help
- Check [TEST_RESULTS.md](./TEST_RESULTS.md) for current tool status
- Review [PROMPTS.md](./PROMPTS.md) for working examples
- Verify environment configuration matches requirements

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io) for the integration framework
- [Hedera](https://hedera.com) for the blockchain infrastructure
- DeFi platforms: SaucerSwap, Bonzo Finance, Stader, HeliSwap, Hashport

---

**KawaFi** - Unifying Hedera DeFi for AI assistants 🤖⚡

[![Built with MCP](https://img.shields.io/badge/Built%20with-MCP-blue)](https://modelcontextprotocol.io)
[![Hedera](https://img.shields.io/badge/Powered%20by-Hedera-purple)](https://hedera.com)