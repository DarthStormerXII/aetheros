# Testing Guide for Claude Desktop

## Prerequisites
1. Claude Desktop installed
2. Node.js installed (v16 or higher)
3. npm installed

## Step 1: Build the MCP Server

```bash
cd /Users/gabrielantonyxaviour/Documents/projects/aya

# Install dependencies
npm install

# Build the TypeScript project
npm run build

# Verify the build
ls dist/  # Should see index.js and other compiled files
```

## Step 2: Configure Claude Desktop

1. Open Claude Desktop settings
2. Navigate to MCP servers configuration
3. Add the following configuration:

```json
{
  "mcpServers": {
    "hedera-defi": {
      "command": "node",
      "args": ["/Users/gabrielantonyxaviour/Documents/projects/aya/dist/index.js"],
      "env": {
        "HEDERA_NETWORK": "mainnet",
        "EXECUTE_TX": "false",
        "HEDERA_OPERATOR_ID": "0.0.12345"
      }
    }
  }
}
```

## Step 3: Test Different Modes

### Test 1: Basic Read-Only Mode (No Auth)
Start with the simplest configuration:

```json
"env": {
  "HEDERA_NETWORK": "mainnet"
}
```

**Available commands to test:**
```
- Use tool: bonzo_get_reserves
- Use tool: hashport_get_supported_assets
- Use tool: bonzo_get_account with accountId: "0.0.123456"
```

### Test 2: Prepare Mode (Transaction Preparation)
Add account ID for transaction preparation:

```json
"env": {
  "HEDERA_NETWORK": "mainnet",
  "EXECUTE_TX": "false",
  "HEDERA_OPERATOR_ID": "0.0.12345"
}
```

**Commands to test:**
```
- Use tool: stader_get_exchange_rate
- Use tool: stader_stake_hbar with amountHbar: "10"
- Use tool: stader_unstake_hbarx with amountHbarx: "1000000000"
```

Expected output for staking:
```json
{
  "type": "prepared_transaction",
  "description": "Stake 10 HBAR to receive HBARX",
  "from": "0.0.12345",
  "to": "0.0.1027588",
  "unsigned": {...}
}
```

### Test 3: Execute Mode (Real Transactions) - USE TESTNET!
⚠️ Only test with a testnet account first!

```json
"env": {
  "HEDERA_NETWORK": "testnet",
  "EXECUTE_TX": "true", 
  "HEDERA_OPERATOR_ID": "0.0.YOUR_TESTNET_ID",
  "HEDERA_OPERATOR_KEY": "YOUR_TESTNET_PRIVATE_KEY"
}
```

Note: Stader isn't on testnet, so this won't work for Stader. But the setup is correct.

### Test 4: With SaucerSwap (If you have API key)
```json
"env": {
  "HEDERA_NETWORK": "mainnet",
  "SAUCERSWAP_API_KEY": "your-api-key-here"
}
```

**Commands to test:**
```
- Use tool: saucerswap_get_pools with version: "v2"
- Use tool: saucerswap_get_quote with tokenIn: "0x...", tokenOut: "0x...", amount: "1000000"
```

## Step 4: Verify Console Output

When you start Claude Desktop with the MCP server, check the console for initialization messages:

### For Prepare Mode:
```
Bonzo Finance client initialized
Hashport client initialized
📝 Transaction PREPARATION mode - will return unsigned transactions
📝 Using account: 0.0.12345
Stader client initialized (mainnet only)
```

### For Execute Mode:
```
⚠️  WARNING: Transaction EXECUTION enabled - private key loaded
⚠️  Using account: 0.0.12345
```

## Common Testing Scenarios

### 1. Check Platform Availability
```
What DeFi platforms are currently available?
```

### 2. Get Current Rates
```
Get the current HBAR to HBARX exchange rate from Stader
```

### 3. Prepare a Stake Transaction
```
Prepare a transaction to stake 5 HBAR on Stader
```

### 4. Check Lending Pools
```
Show me all available lending pools on Bonzo Finance
```

### 5. Get Bridge Quote
```
Get a quote to bridge 100 USDC from Ethereum to Hedera using Hashport
```

## Troubleshooting

### Server not starting?
1. Check if build completed: `ls dist/index.js`
2. Verify path in Claude Desktop config
3. Check console for error messages

### "Client not initialized" errors?
- Ensure environment variables are set correctly
- For Stader/HeliSwap: Need `HEDERA_OPERATOR_ID`
- For SaucerSwap: Need `SAUCERSWAP_API_KEY`

### Transaction preparation not working?
- Verify `HEDERA_OPERATOR_ID` is set
- Check network (mainnet/testnet)
- Stader only works on mainnet

### Console not showing?
- Run Claude Desktop from terminal to see console output
- On macOS: `/Applications/Claude.app/Contents/MacOS/Claude`
- On Windows: Run from command prompt

## Safety Tips

1. **Always start with EXECUTE_TX=false**
2. **Test on testnet first** (for platforms that support it)
3. **Use a dedicated test account** with minimal funds
4. **Never put your main wallet private key** in the config
5. **Monitor all transactions** if using execute mode

## Example Full Test Flow

1. Start with basic read-only mode
2. Test Bonzo Finance reserve queries
3. Add account ID and test transaction preparation
4. Verify prepared transaction output
5. Only if comfortable, test execution on testnet
6. Finally, test on mainnet with small amounts

Remember: The default prepare mode is much safer and perfect for testing!