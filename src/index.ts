#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import dotenv from "dotenv";
import { Client, Hbar, HbarUnit } from "@hashgraph/sdk";
import { SaucerSwapClient } from "./clients/saucerswap.js";
import { BonzoFinanceClient } from "./clients/bonzo.js";
import { HashportClient } from "./clients/hashport.js";
import { StaderClient } from "./clients/stader.js";
import { HeliSwapClient } from "./clients/heliswap.js";

dotenv.config();

const server = new Server(
  {
    name: "kawa-fi-mcp",
    version: "1.0.6",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define Zod schemas for each tool
const saucerswapGetTokensSchema = z.object({}).strict();

const saucerswapGetStatsSchema = z.object({}).strict();

const saucerswapGetSssStatsSchema = z.object({}).strict();

const saucerswapGetHbarPricesSchema = z.object({
  fromSeconds: z.number().describe("Start timestamp in Unix seconds"),
  toSeconds: z.number().describe("End timestamp in Unix seconds"),
}).strict();

const saucerswapGetPlatformDataSchema = z.object({
  fromSeconds: z.number().describe("Start timestamp in Unix seconds"),
  toSeconds: z.number().describe("End timestamp in Unix seconds"),
  interval: z.enum(["HOUR", "DAY", "WEEK"]).default("HOUR").describe("Data interval"),
  field: z.enum(["LIQUIDITY", "VOLUME"]).default("LIQUIDITY").describe("Data type to retrieve"),
}).strict();

const saucerswapGetFarmsSchema = z.object({}).strict();

const saucerswapGetFarmsByAccountSchema = z.object({
  accountId: z.string().describe("Hedera account ID (e.g., 0.0.123456)"),
}).strict();

const saucerswapGetPoolsSchema = z.object({}).strict();

const saucerswapGetDefaultTokensSchema = z.object({}).strict();

const saucerswapGetV2PoolsSchema = z.object({}).strict();

// SaucerSwap transaction tools schemas
const saucerswapQuoteExactInputSchema = z.object({
  tokens: z.array(z.string()).describe("Array of token addresses for the swap path"),
  fees: z.array(z.number()).describe("Array of pool fees (500, 1500, 3000, 10000)"),
  amountIn: z.string().describe("Input amount in token's smallest unit"),
}).strict();

const saucerswapQuoteExactOutputSchema = z.object({
  tokens: z.array(z.string()).describe("Array of token addresses for the swap path"),
  fees: z.array(z.number()).describe("Array of pool fees (500, 1500, 3000, 10000)"),
  amountOut: z.string().describe("Output amount in token's smallest unit"),
}).strict();

const saucerswapSwapHbarForTokensSchema = z.object({
  outputToken: z.string().describe("Output token address"),
  fee: z.number().describe("Pool fee (500, 1500, 3000, 10000)"),
  amountIn: z.string().describe("HBAR amount in tinybar"),
  amountOutMinimum: z.string().describe("Minimum output tokens in smallest unit"),
  recipient: z.string().optional().describe("Recipient address (defaults to account)"),
  deadline: z.number().optional().describe("Unix timestamp deadline"),
}).strict();

const saucerswapSwapTokensForHbarSchema = z.object({
  inputToken: z.string().describe("Input token address"),
  fee: z.number().describe("Pool fee (500, 1500, 3000, 10000)"),
  amountIn: z.string().describe("Input token amount in smallest unit"),
  amountOutMinimum: z.string().describe("Minimum HBAR output in tinybar"),
  recipient: z.string().optional().describe("Recipient address (defaults to account)"),
  deadline: z.number().optional().describe("Unix timestamp deadline"),
}).strict();

const saucerswapSwapTokensForTokensSchema = z.object({
  inputToken: z.string().describe("Input token address"),
  outputToken: z.string().describe("Output token address"),
  fees: z.array(z.number()).describe("Array of pool fees for multi-hop swaps"),
  amountIn: z.string().describe("Input token amount in smallest unit"),
  amountOutMinimum: z.string().describe("Minimum output tokens in smallest unit"),
  recipient: z.string().optional().describe("Recipient address (defaults to account)"),
  deadline: z.number().optional().describe("Unix timestamp deadline"),
}).strict();

const saucerswapStakeSauceSchema = z.object({
  amount: z.string().describe("SAUCE amount to stake in smallest unit"),
}).strict();

const saucerswapUnstakeXSauceSchema = z.object({
  amount: z.string().describe("xSAUCE amount to unstake in smallest unit"),
}).strict();

const saucerswapDepositToFarmSchema = z.object({
  poolId: z.number().describe("Farm pool ID"),
  amount: z.string().describe("LP token amount in smallest unit"),
  depositFeeHbar: z.string().describe("Deposit fee in tinybar"),
}).strict();

const saucerswapWithdrawFromFarmSchema = z.object({
  poolId: z.number().describe("Farm pool ID"),
  amount: z.string().describe("LP token amount to withdraw in smallest unit"),
}).strict();

const bonzoGetReservesSchema = z.object({}).strict();

const bonzoGetAccountSchema = z.object({
  accountId: z.string().describe("Hedera account ID (e.g., 0.0.123456)"),
}).strict();

const bonzoGetLiquidationsSchema = z.object({}).strict();

const staderGetExchangeRateSchema = z.object({}).strict();

const staderStakeHbarSchema = z.object({
  amountHbar: z.string().describe("Amount of HBAR to stake (e.g., '10' for 10 HBAR)"),
}).strict();

const staderUnstakeHbarxSchema = z.object({
  amountHbarx: z.string().describe("Amount of HBARX to unstake in smallest unit"),
}).strict();

const heliswapGetPairInfoSchema = z.object({
  token0: z.string().describe("First token address"),
  token1: z.string().describe("Second token address"),
}).strict();

const hashportGetSupportedAssetsSchema = z.object({
  sourceNetwork: z.string().optional().describe("Source network ID"),
  targetNetwork: z.string().optional().describe("Target network ID"),
}).strict();

const hashportGetBridgeStepsSchema = z.object({
  sourceNetworkId: z.string().describe("Source network ID"),
  targetNetworkId: z.string().describe("Target network ID"),
  sourceAssetId: z.string().describe("Asset ID on source network"),
  recipient: z.string().describe("Recipient address on target network"),
  amount: z.string().optional().describe("Amount to bridge"),
  tokenId: z.string().optional().describe("Token ID for NFTs"),
}).strict();

const hashportValidateBridgeSchema = z.object({
  sourceNetworkId: z.string().describe("Source network ID"),
  targetNetworkId: z.string().describe("Target network ID"),
  sourceAssetId: z.string().describe("Asset ID on source network"),
  recipient: z.string().describe("Recipient address on target network"),
  amount: z.string().optional().describe("Amount to bridge"),
  tokenId: z.string().optional().describe("Token ID for NFTs"),
}).strict();

const hashportGetTransfersSchema = z.object({
  page: z.number().min(1).describe("Page number (starts from 1)"),
  pageSize: z.number().min(1).max(50).describe("Page size (max 50)"),
  filter: z.object({
    originator: z.string().optional().describe("Originator address/account ID"),
    timestamp: z.string().optional().describe("Timestamp in RFC3339Nano format"),
    tokenId: z.string().optional().describe("Token ID or token address"),
    transactionId: z.string().optional().describe("Transaction ID or transaction hash"),
  }).optional().describe("Optional filters"),
}).strict();

const hashportGetNetworkAssetsSchema = z.object({
  networkId: z.string().describe("Network ID"),
}).strict();

const hashportGetNetworkAssetAmountsSchema = z.object({
  networkId: z.string().describe("Network ID"),
  assetId: z.string().describe("Asset ID"),
}).strict();

const hashportGetNetworkAssetDetailsSchema = z.object({
  networkId: z.string().describe("Network ID"),
  assetId: z.string().describe("Asset ID"),
}).strict();

const hashportConvertHederaTxIdSchema = z.object({
  txId: z.string().describe("Hedera transaction ID to convert"),
}).strict();

// Define tools by platform
const SAUCERSWAP_TOOLS: Tool[] = [
  {
    name: "saucerswap_get_tokens",
    description: "Get all tokens available on SaucerSwap with prices and metadata",
    inputSchema: zodToJsonSchema(saucerswapGetTokensSchema) as any,
  },
  {
    name: "saucerswap_get_stats",
    description: "Get SaucerSwap platform statistics including TVL, volume, and SAUCE circulation",
    inputSchema: zodToJsonSchema(saucerswapGetStatsSchema) as any,
  },
  {
    name: "saucerswap_get_sss_stats",
    description: "Get Single-Sided Staking (SSS) statistics and XSAUCE ratio",
    inputSchema: zodToJsonSchema(saucerswapGetSssStatsSchema) as any,
  },
  {
    name: "saucerswap_get_hbar_prices",
    description: "Get historical HBAR price data (minutely resolution)",
    inputSchema: zodToJsonSchema(saucerswapGetHbarPricesSchema) as any,
  },
  {
    name: "saucerswap_get_platform_data",
    description: "Get historical platform liquidity or volume data with time intervals",
    inputSchema: zodToJsonSchema(saucerswapGetPlatformDataSchema) as any,
  },
  {
    name: "saucerswap_get_farms",
    description: "Get list of active yield farming opportunities",
    inputSchema: zodToJsonSchema(saucerswapGetFarmsSchema) as any,
  },
  {
    name: "saucerswap_get_farms_by_account",
    description: "Get LP token amounts in farms by account ID",
    inputSchema: zodToJsonSchema(saucerswapGetFarmsByAccountSchema) as any,
  },
  {
    name: "saucerswap_get_pools",
    description: "Get all liquidity pools with reserves and token information",
    inputSchema: zodToJsonSchema(saucerswapGetPoolsSchema) as any,
  },
  {
    name: "saucerswap_get_default_tokens",
    description: "Get default listed tokens with hourly, daily, and weekly price changes",
    inputSchema: zodToJsonSchema(saucerswapGetDefaultTokensSchema) as any,
  },
  {
    name: "saucerswap_get_v2_pools",
    description: "Get SaucerSwap V2 pools with advanced metrics including fees, ticks, and liquidity",
    inputSchema: zodToJsonSchema(saucerswapGetV2PoolsSchema) as any,
  },
  {
    name: "saucerswap_quote_exact_input",
    description: "Get swap quote for exact input amount",
    inputSchema: zodToJsonSchema(saucerswapQuoteExactInputSchema) as any,
  },
  {
    name: "saucerswap_quote_exact_output", 
    description: "Get swap quote for exact output amount",
    inputSchema: zodToJsonSchema(saucerswapQuoteExactOutputSchema) as any,
  },
  {
    name: "saucerswap_swap_hbar_for_tokens",
    description: process.env.EXECUTE_TX === "true" 
      ? "Swap exact HBAR for tokens (will execute transaction)"
      : "Prepare HBAR to tokens swap transaction (returns unsigned transaction)",
    inputSchema: zodToJsonSchema(saucerswapSwapHbarForTokensSchema) as any,
  },
  {
    name: "saucerswap_swap_tokens_for_hbar",
    description: process.env.EXECUTE_TX === "true"
      ? "Swap exact tokens for HBAR (will execute transaction)" 
      : "Prepare tokens to HBAR swap transaction (returns unsigned transaction)",
    inputSchema: zodToJsonSchema(saucerswapSwapTokensForHbarSchema) as any,
  },
  {
    name: "saucerswap_swap_tokens_for_tokens",
    description: process.env.EXECUTE_TX === "true"
      ? "Swap exact tokens for tokens (will execute transaction)"
      : "Prepare tokens to tokens swap transaction (returns unsigned transaction)",
    inputSchema: zodToJsonSchema(saucerswapSwapTokensForTokensSchema) as any,
  },
  {
    name: "saucerswap_stake_sauce",
    description: process.env.EXECUTE_TX === "true"
      ? "Stake SAUCE for xSAUCE (will execute transaction)"
      : "Prepare SAUCE staking transaction (returns unsigned transaction)",
    inputSchema: zodToJsonSchema(saucerswapStakeSauceSchema) as any,
  },
  {
    name: "saucerswap_unstake_xsauce", 
    description: process.env.EXECUTE_TX === "true"
      ? "Unstake xSAUCE for SAUCE (will execute transaction)"
      : "Prepare xSAUCE unstaking transaction (returns unsigned transaction)",
    inputSchema: zodToJsonSchema(saucerswapUnstakeXSauceSchema) as any,
  },
  {
    name: "saucerswap_deposit_to_farm",
    description: process.env.EXECUTE_TX === "true"
      ? "Deposit LP tokens to farm (will execute transaction)"
      : "Prepare farm deposit transaction (returns unsigned transaction)",
    inputSchema: zodToJsonSchema(saucerswapDepositToFarmSchema) as any,
  },
  {
    name: "saucerswap_withdraw_from_farm",
    description: process.env.EXECUTE_TX === "true"
      ? "Withdraw LP tokens from farm (will execute transaction)"
      : "Prepare farm withdrawal transaction (returns unsigned transaction)", 
    inputSchema: zodToJsonSchema(saucerswapWithdrawFromFarmSchema) as any,
  },
];

const BONZO_TOOLS: Tool[] = [
  {
    name: "bonzo_get_reserves",
    description: "Get all lending/borrowing reserves from Bonzo Finance",
    inputSchema: zodToJsonSchema(bonzoGetReservesSchema) as any,
  },
  {
    name: "bonzo_get_account",
    description: "Get account positions from Bonzo Finance",
    inputSchema: zodToJsonSchema(bonzoGetAccountSchema) as any,
  },
  {
    name: "bonzo_get_liquidations",
    description: "Get accounts with outstanding debt eligible for liquidation",
    inputSchema: zodToJsonSchema(bonzoGetLiquidationsSchema) as any,
  },
];

const getStaderTools = (): Tool[] => [
  {
    name: "stader_get_exchange_rate",
    description: "Get current HBAR to HBARX exchange rate",
    inputSchema: zodToJsonSchema(staderGetExchangeRateSchema) as any,
  },
  {
    name: "stader_stake_hbar",
    description: process.env.EXECUTE_TX === "true" 
      ? "Stake HBAR to receive HBARX (will execute transaction)"
      : "Prepare HBAR staking transaction (returns unsigned transaction)",
    inputSchema: zodToJsonSchema(staderStakeHbarSchema) as any,
  },
  {
    name: "stader_unstake_hbarx",
    description: process.env.EXECUTE_TX === "true"
      ? "Unstake HBARX to receive HBAR (will execute transaction)"
      : "Prepare HBARX unstaking transaction (returns unsigned transaction)",
    inputSchema: zodToJsonSchema(staderUnstakeHbarxSchema) as any,
  },
];

const HELISWAP_TOOLS: Tool[] = [
  {
    name: "heliswap_get_pair_info",
    description: "Get trading pair information from HeliSwap",
    inputSchema: zodToJsonSchema(heliswapGetPairInfoSchema) as any,
  },
];

const HASHPORT_TOOLS: Tool[] = [
  {
    name: "hashport_get_supported_assets",
    description: "Get list of assets supported by Hashport bridge",
    inputSchema: zodToJsonSchema(hashportGetSupportedAssetsSchema) as any,
  },
  {
    name: "hashport_get_supported_networks",
    description: "Get all networks supported by Hashport",
    inputSchema: zodToJsonSchema(z.object({})) as any,
  },
  {
    name: "hashport_get_bridge_steps",
    description: "Get step-by-step instructions for bridging assets via Hashport",
    inputSchema: zodToJsonSchema(hashportGetBridgeStepsSchema) as any,
  },
  {
    name: "hashport_validate_bridge",
    description: "Validate bridge parameters before initiating a bridge",
    inputSchema: zodToJsonSchema(hashportValidateBridgeSchema) as any,
  },
  {
    name: "hashport_get_assets_amounts",
    description: "Get reserve amounts for all assets on Hashport",
    inputSchema: zodToJsonSchema(z.object({})) as any,
  },
  {
    name: "hashport_get_transfers",
    description: "Get paginated list of transfers with optional filtering",
    inputSchema: zodToJsonSchema(hashportGetTransfersSchema) as any,
  },
  {
    name: "hashport_get_network_assets",
    description: "Get assets available on a specific network",
    inputSchema: zodToJsonSchema(hashportGetNetworkAssetsSchema) as any,
  },
  {
    name: "hashport_get_network_asset_amounts",
    description: "Get amounts for a specific asset on a network",
    inputSchema: zodToJsonSchema(hashportGetNetworkAssetAmountsSchema) as any,
  },
  {
    name: "hashport_get_network_asset_details",
    description: "Get detailed information for a specific asset on a network",
    inputSchema: zodToJsonSchema(hashportGetNetworkAssetDetailsSchema) as any,
  },
  {
    name: "hashport_convert_hedera_tx_id",
    description: "Convert Hedera transaction ID format",
    inputSchema: zodToJsonSchema(hashportConvertHederaTxIdSchema) as any,
  },
];

// Function to get available tools based on initialized clients
const getAvailableTools = (): Tool[] => {
  const tools: Tool[] = [];
  
  // SaucerSwap tools - only if client is initialized
  if (saucerSwapClient) {
    tools.push(...SAUCERSWAP_TOOLS);
  }
  
  // Bonzo tools - always available
  if (bonzoClient) {
    tools.push(...BONZO_TOOLS);
  }
  
  // Stader tools - only if client is initialized
  if (staderClient) {
    tools.push(...getStaderTools());
  }
  
  // HeliSwap tools - only if client is initialized
  if (heliSwapClient) {
    tools.push(...HELISWAP_TOOLS);
  }
  
  // Hashport tools - always available
  if (hashportClient) {
    tools.push(...HASHPORT_TOOLS);
  }
  
  return tools;
};

// Create a map of tool names to their Zod schemas for validation
const toolSchemas = {
  saucerswap_get_tokens: saucerswapGetTokensSchema,
  saucerswap_get_stats: saucerswapGetStatsSchema,
  saucerswap_get_sss_stats: saucerswapGetSssStatsSchema,
  saucerswap_get_hbar_prices: saucerswapGetHbarPricesSchema,
  saucerswap_get_platform_data: saucerswapGetPlatformDataSchema,
  saucerswap_get_farms: saucerswapGetFarmsSchema,
  saucerswap_get_farms_by_account: saucerswapGetFarmsByAccountSchema,
  saucerswap_get_pools: saucerswapGetPoolsSchema,
  saucerswap_get_default_tokens: saucerswapGetDefaultTokensSchema,
  saucerswap_get_v2_pools: saucerswapGetV2PoolsSchema,
  saucerswap_quote_exact_input: saucerswapQuoteExactInputSchema,
  saucerswap_quote_exact_output: saucerswapQuoteExactOutputSchema,
  saucerswap_swap_hbar_for_tokens: saucerswapSwapHbarForTokensSchema,
  saucerswap_swap_tokens_for_hbar: saucerswapSwapTokensForHbarSchema,
  saucerswap_swap_tokens_for_tokens: saucerswapSwapTokensForTokensSchema,
  saucerswap_stake_sauce: saucerswapStakeSauceSchema,
  saucerswap_unstake_xsauce: saucerswapUnstakeXSauceSchema,
  saucerswap_deposit_to_farm: saucerswapDepositToFarmSchema,
  saucerswap_withdraw_from_farm: saucerswapWithdrawFromFarmSchema,
  bonzo_get_reserves: bonzoGetReservesSchema,
  bonzo_get_account: bonzoGetAccountSchema,
  bonzo_get_liquidations: bonzoGetLiquidationsSchema,
  stader_get_exchange_rate: staderGetExchangeRateSchema,
  stader_stake_hbar: staderStakeHbarSchema,
  stader_unstake_hbarx: staderUnstakeHbarxSchema,
  heliswap_get_pair_info: heliswapGetPairInfoSchema,
  hashport_get_supported_assets: hashportGetSupportedAssetsSchema,
  hashport_get_supported_networks: z.object({}),
  hashport_get_bridge_steps: hashportGetBridgeStepsSchema,
  hashport_validate_bridge: hashportValidateBridgeSchema,
  hashport_get_assets_amounts: z.object({}),
  hashport_get_transfers: hashportGetTransfersSchema,
  hashport_get_network_assets: hashportGetNetworkAssetsSchema,
  hashport_get_network_asset_amounts: hashportGetNetworkAssetAmountsSchema,
  hashport_get_network_asset_details: hashportGetNetworkAssetDetailsSchema,
  hashport_convert_hedera_tx_id: hashportConvertHederaTxIdSchema,
} as const;

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: getAvailableTools(),
}));

let saucerSwapClient: SaucerSwapClient;
let bonzoClient: BonzoFinanceClient;
let hashportClient: HashportClient;
let staderClient: StaderClient | null = null;
let heliSwapClient: HeliSwapClient | null = null;
let hederaClient: Client | null = null;
let executeTransactions: boolean = false;
let operatorAccountId: string | null = null;

const initializeClients = () => {
  const isTestnet = process.env.HEDERA_NETWORK === "testnet";
  
  // SaucerSwap - initialize basic client first (will be updated later with Hedera client if available)
  if (process.env.SAUCERSWAP_API_KEY) {
    saucerSwapClient = new SaucerSwapClient(process.env.SAUCERSWAP_API_KEY, isTestnet);
    console.error("SaucerSwap client initialized (read-only mode)");
  } else {
    console.error("SaucerSwap disabled - SAUCERSWAP_API_KEY not provided");
  }
  
  // Bonzo Finance - always available
  bonzoClient = new BonzoFinanceClient(isTestnet);
  console.error("Bonzo Finance client initialized");
  
  // Hashport - always available
  hashportClient = new HashportClient();
  console.error("Hashport client initialized");
  
  // Check transaction execution mode
  executeTransactions = process.env.EXECUTE_TX === "true";
  
  // Use network-specific Hedera credentials
  operatorAccountId = isTestnet 
    ? (process.env.TESTNET_HEDERA_OPERATOR_ID || null)
    : (process.env.MAINNET_HEDERA_OPERATOR_ID || null);
  
  // Hedera-based services (Stader, HeliSwap)
  if (operatorAccountId) {
    try {
      hederaClient = isTestnet ? Client.forTestnet() : Client.forMainnet();
      
      if (executeTransactions) {
        // Full execution mode - requires private key
        const operatorKey = isTestnet 
          ? process.env.TESTNET_HEDERA_OPERATOR_KEY
          : process.env.MAINNET_HEDERA_OPERATOR_KEY;
          
        if (!operatorKey) {
          const keyName = isTestnet ? "TESTNET_HEDERA_OPERATOR_KEY" : "MAINNET_HEDERA_OPERATOR_KEY";
          throw new Error(`EXECUTE_TX=true requires ${keyName}`);
        }
        
        hederaClient.setOperator(operatorAccountId, operatorKey);
        
        console.error("⚠️  WARNING: Transaction EXECUTION enabled - private key loaded");
        console.error("⚠️  Using account:", operatorAccountId);
      } else {
        // Prepare-only mode - set minimal operator for queries (without storing private key)
        const operatorKey = isTestnet 
          ? process.env.TESTNET_HEDERA_OPERATOR_KEY
          : process.env.MAINNET_HEDERA_OPERATOR_KEY;
          
        if (operatorKey) {
          // If key is provided, use it for queries
          hederaClient.setOperator(operatorAccountId, operatorKey);
          console.error("📝 Transaction PREPARATION mode with query capability");
        } else {
          // Minimal setup for queries only - use a dummy key that won't be used for transactions
          console.error("📝 Transaction PREPARATION mode - queries may be limited without operator key");
        }
        console.error("📝 Using account:", operatorAccountId);
      }
      
      // Stader - Mainnet only
      if (!isTestnet) {
        // Stader staking contract address on mainnet
        const STADER_STAKING_CONTRACT_MAINNET = "0.0.1027588";
        staderClient = new StaderClient(
          hederaClient, 
          STADER_STAKING_CONTRACT_MAINNET,
          executeTransactions,
          operatorAccountId
        );
        console.error("Stader client initialized (mainnet only)");
    } else {
      console.error("Stader disabled - not available on testnet");
    }
    
    // HeliSwap - Mainnet only with updated addresses
    if (!isTestnet) {
      const HELISWAP_FACTORY_MAINNET = "0x0000000000000000000000000000000000134224";
      const HELISWAP_ROUTER_MAINNET = "0x00000000000000000000000000000000002cc9B2";
      heliSwapClient = new HeliSwapClient(
        hederaClient, 
        HELISWAP_FACTORY_MAINNET,
        HELISWAP_ROUTER_MAINNET
      );
      console.error("HeliSwap client initialized (mainnet only)");
    } else {
      console.error("HeliSwap disabled - not available on testnet");
    }
    
    // Update SaucerSwap client with Hedera transaction capabilities
    if (process.env.SAUCERSWAP_API_KEY && saucerSwapClient) {
      saucerSwapClient = new SaucerSwapClient(
        process.env.SAUCERSWAP_API_KEY, 
        isTestnet,
        hederaClient,
        executeTransactions,
        operatorAccountId
      );
      console.error("SaucerSwap client updated with transaction capabilities");
    }
    } catch (error) {
      console.error("Failed to initialize Hedera client:", error);
      console.error("Stader and HeliSwap disabled due to initialization error");
    }
  } else {
    console.error("Stader and HeliSwap disabled - Hedera credentials not provided");
  }
};

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Validate arguments using the appropriate schema
    const schema = toolSchemas[name as keyof typeof toolSchemas];
    if (!schema) {
      throw new Error(`Unknown tool: ${name}`);
    }
    
    const validatedArgs = schema.parse(args);

    switch (name) {
      case "saucerswap_get_tokens": {
        if (!saucerSwapClient) throw new Error("SaucerSwap client not initialized");
        const result = await saucerSwapClient.getTokens();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "saucerswap_get_stats": {
        if (!saucerSwapClient) throw new Error("SaucerSwap client not initialized");
        const result = await saucerSwapClient.getStats();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "saucerswap_get_sss_stats": {
        if (!saucerSwapClient) throw new Error("SaucerSwap client not initialized");
        const result = await saucerSwapClient.getSingleSidedStakingStats();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "saucerswap_get_hbar_prices": {
        if (!saucerSwapClient) throw new Error("SaucerSwap client not initialized");
        const typedArgs = validatedArgs as z.infer<typeof saucerswapGetHbarPricesSchema>;
        const result = await saucerSwapClient.getHbarHistoricalPrices(typedArgs.fromSeconds, typedArgs.toSeconds);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "saucerswap_get_platform_data": {
        if (!saucerSwapClient) throw new Error("SaucerSwap client not initialized");
        const typedArgs = validatedArgs as z.infer<typeof saucerswapGetPlatformDataSchema>;
        const result = await saucerSwapClient.getPlatformData(
          typedArgs.fromSeconds, 
          typedArgs.toSeconds, 
          typedArgs.interval, 
          typedArgs.field
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
      
      case "saucerswap_get_farms": {
        if (!saucerSwapClient) throw new Error("SaucerSwap client not initialized");
        const result = await saucerSwapClient.getFarms();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "saucerswap_get_farms_by_account": {
        if (!saucerSwapClient) throw new Error("SaucerSwap client not initialized");
        const typedArgs = validatedArgs as z.infer<typeof saucerswapGetFarmsByAccountSchema>;
        const result = await saucerSwapClient.getFarmsByAccount(typedArgs.accountId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "saucerswap_get_pools": {
        if (!saucerSwapClient) throw new Error("SaucerSwap client not initialized");
        const result = await saucerSwapClient.getPools();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "saucerswap_get_default_tokens": {
        if (!saucerSwapClient) throw new Error("SaucerSwap client not initialized");
        const result = await saucerSwapClient.getDefaultTokens();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "saucerswap_get_v2_pools": {
        if (!saucerSwapClient) throw new Error("SaucerSwap client not initialized");
        const result = await saucerSwapClient.getV2Pools();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "saucerswap_quote_exact_input": {
        if (!saucerSwapClient) throw new Error("SaucerSwap client not initialized");
        const typedArgs = validatedArgs as z.infer<typeof saucerswapQuoteExactInputSchema>;
        const result = await saucerSwapClient.quoteExactInput(
          typedArgs.tokens,
          typedArgs.fees,
          typedArgs.amountIn
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "saucerswap_quote_exact_output": {
        if (!saucerSwapClient) throw new Error("SaucerSwap client not initialized");
        const typedArgs = validatedArgs as z.infer<typeof saucerswapQuoteExactOutputSchema>;
        const result = await saucerSwapClient.quoteExactOutput(
          typedArgs.tokens,
          typedArgs.fees,
          typedArgs.amountOut
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "saucerswap_swap_hbar_for_tokens": {
        if (!saucerSwapClient) throw new Error("SaucerSwap client not initialized");
        const typedArgs = validatedArgs as z.infer<typeof saucerswapSwapHbarForTokensSchema>;
        const result = await saucerSwapClient.swapExactHbarForTokens(
          typedArgs.outputToken,
          typedArgs.fee,
          typedArgs.amountIn,
          typedArgs.amountOutMinimum,
          typedArgs.recipient,
          typedArgs.deadline
        );
        
        if (result.type === "executed") {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  transactionId: result.transactionId,
                  message: "HBAR swap completed successfully",
                  note: "Transaction confirmed on Hedera network"
                }, null, 2),
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  type: "prepared_transaction",
                  description: result.description,
                  from: result.from,
                  to: result.to,
                  function: result.function,
                  params: result.params,
                  value: result.value,
                  gas: result.gas,
                  unsigned: result.unsigned,
                  note: "Transaction prepared - sign and submit with your preferred method"
                }, null, 2),
              },
            ],
          };
        }
      }

      case "saucerswap_swap_tokens_for_hbar": {
        if (!saucerSwapClient) throw new Error("SaucerSwap client not initialized");
        const typedArgs = validatedArgs as z.infer<typeof saucerswapSwapTokensForHbarSchema>;
        const result = await saucerSwapClient.swapExactTokensForHbar(
          typedArgs.inputToken,
          typedArgs.fee,
          typedArgs.amountIn,
          typedArgs.amountOutMinimum,
          typedArgs.recipient,
          typedArgs.deadline
        );
        
        if (result.type === "executed") {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  transactionId: result.transactionId,
                  message: "Token to HBAR swap completed successfully",
                  note: "Transaction confirmed on Hedera network"
                }, null, 2),
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  type: "prepared_transaction",
                  description: result.description,
                  from: result.from,
                  to: result.to,
                  function: result.function,
                  params: result.params,
                  value: result.value,
                  gas: result.gas,
                  unsigned: result.unsigned,
                  note: "Transaction prepared - sign and submit with your preferred method"
                }, null, 2),
              },
            ],
          };
        }
      }

      case "saucerswap_swap_tokens_for_tokens": {
        if (!saucerSwapClient) throw new Error("SaucerSwap client not initialized");
        const typedArgs = validatedArgs as z.infer<typeof saucerswapSwapTokensForTokensSchema>;
        const result = await saucerSwapClient.swapExactTokensForTokens(
          typedArgs.inputToken,
          typedArgs.outputToken,
          typedArgs.fees,
          typedArgs.amountIn,
          typedArgs.amountOutMinimum,
          typedArgs.recipient,
          typedArgs.deadline
        );
        
        if (result.type === "executed") {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  transactionId: result.transactionId,
                  message: "Token swap completed successfully",
                  note: "Transaction confirmed on Hedera network"
                }, null, 2),
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  type: "prepared_transaction",
                  description: result.description,
                  from: result.from,
                  to: result.to,
                  function: result.function,
                  params: result.params,
                  value: result.value,
                  gas: result.gas,
                  unsigned: result.unsigned,
                  note: "Transaction prepared - sign and submit with your preferred method"
                }, null, 2),
              },
            ],
          };
        }
      }

      case "saucerswap_stake_sauce": {
        if (!saucerSwapClient) throw new Error("SaucerSwap client not initialized");
        const typedArgs = validatedArgs as z.infer<typeof saucerswapStakeSauceSchema>;
        const result = await saucerSwapClient.stakeSauceForXSauce(typedArgs.amount);
        
        if (result.type === "executed") {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  transactionId: result.transactionId,
                  message: "SAUCE staking completed successfully",
                  note: "Transaction confirmed on Hedera network"
                }, null, 2),
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  type: "prepared_transaction",
                  description: result.description,
                  from: result.from,
                  to: result.to,
                  function: result.function,
                  params: result.params,
                  value: result.value,
                  gas: result.gas,
                  unsigned: result.unsigned,
                  note: "Transaction prepared - sign and submit with your preferred method"
                }, null, 2),
              },
            ],
          };
        }
      }

      case "saucerswap_unstake_xsauce": {
        if (!saucerSwapClient) throw new Error("SaucerSwap client not initialized");
        const typedArgs = validatedArgs as z.infer<typeof saucerswapUnstakeXSauceSchema>;
        const result = await saucerSwapClient.unstakeXSauceForSauce(typedArgs.amount);
        
        if (result.type === "executed") {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  transactionId: result.transactionId,
                  message: "xSAUCE unstaking completed successfully",
                  note: "Transaction confirmed on Hedera network"
                }, null, 2),
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  type: "prepared_transaction",
                  description: result.description,
                  from: result.from,
                  to: result.to,
                  function: result.function,
                  params: result.params,
                  value: result.value,
                  gas: result.gas,
                  unsigned: result.unsigned,
                  note: "Transaction prepared - sign and submit with your preferred method"
                }, null, 2),
              },
            ],
          };
        }
      }

      case "saucerswap_deposit_to_farm": {
        if (!saucerSwapClient) throw new Error("SaucerSwap client not initialized");
        const typedArgs = validatedArgs as z.infer<typeof saucerswapDepositToFarmSchema>;
        const result = await saucerSwapClient.depositLpTokensToFarm(
          typedArgs.poolId,
          typedArgs.amount,
          typedArgs.depositFeeHbar
        );
        
        if (result.type === "executed") {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  transactionId: result.transactionId,
                  message: "Farm deposit completed successfully",
                  note: "Transaction confirmed on Hedera network"
                }, null, 2),
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  type: "prepared_transaction",
                  description: result.description,
                  from: result.from,
                  to: result.to,
                  function: result.function,
                  params: result.params,
                  value: result.value,
                  gas: result.gas,
                  unsigned: result.unsigned,
                  note: "Transaction prepared - sign and submit with your preferred method"
                }, null, 2),
              },
            ],
          };
        }
      }

      case "saucerswap_withdraw_from_farm": {
        if (!saucerSwapClient) throw new Error("SaucerSwap client not initialized");
        const typedArgs = validatedArgs as z.infer<typeof saucerswapWithdrawFromFarmSchema>;
        const result = await saucerSwapClient.withdrawLpTokensFromFarm(
          typedArgs.poolId,
          typedArgs.amount
        );
        
        if (result.type === "executed") {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  transactionId: result.transactionId,
                  message: "Farm withdrawal completed successfully",
                  note: "Transaction confirmed on Hedera network"
                }, null, 2),
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  type: "prepared_transaction",
                  description: result.description,
                  from: result.from,
                  to: result.to,
                  function: result.function,
                  params: result.params,
                  value: result.value,
                  gas: result.gas,
                  unsigned: result.unsigned,
                  note: "Transaction prepared - sign and submit with your preferred method"
                }, null, 2),
              },
            ],
          };
        }
      }
      
      case "bonzo_get_reserves": {
        if (!bonzoClient) throw new Error("Bonzo client not initialized");
        const result = await bonzoClient.getReserves();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
      
      case "bonzo_get_account": {
        if (!bonzoClient) throw new Error("Bonzo client not initialized");
        const typedArgs = validatedArgs as z.infer<typeof bonzoGetAccountSchema>;
        const { accountId } = typedArgs;
        const result = await bonzoClient.getAccountDashboard(accountId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
      
      case "bonzo_get_liquidations": {
        if (!bonzoClient) throw new Error("Bonzo client not initialized");
        const result = await bonzoClient.getLiquidationCandidates();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
      
      case "stader_get_exchange_rate": {
        if (!staderClient) throw new Error("Stader client not initialized - Hedera credentials required");
        const result = await staderClient.getExchangeRate();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
      
      case "stader_stake_hbar": {
        if (!staderClient) throw new Error("Stader client not initialized - Hedera account ID required");
        const typedArgs = validatedArgs as z.infer<typeof staderStakeHbarSchema>;
        const { amountHbar } = typedArgs;
        
        // Convert HBAR string to Hbar object
        const hbarAmount = Hbar.from(amountHbar, HbarUnit.Hbar);
        
        // Execute or prepare the stake transaction
        const result = await staderClient.stake(hbarAmount);
        
        if (result.type === "executed") {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  transactionId: result.transactionId,
                  message: `Successfully staked ${amountHbar} HBAR`,
                  note: "Transaction confirmed on Hedera network"
                }, null, 2),
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  type: "prepared_transaction",
                  description: result.description,
                  from: result.from,
                  to: result.to,
                  value: result.value,
                  gas: result.gas,
                  unsigned: result.unsigned,
                  note: "Transaction prepared - sign and submit with your preferred method"
                }, null, 2),
              },
            ],
          };
        }
      }
      
      case "stader_unstake_hbarx": {
        if (!staderClient) throw new Error("Stader client not initialized - Hedera account ID required");
        const typedArgs = validatedArgs as z.infer<typeof staderUnstakeHbarxSchema>;
        const { amountHbarx } = typedArgs;
        
        // Execute or prepare the unstake transaction
        const result = await staderClient.unstake(amountHbarx);
        
        if (result.type === "executed") {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  transactionId: result.transactionId,
                  message: `Successfully unstaked ${amountHbarx} HBARX`,
                  note: "Transaction confirmed on Hedera network"
                }, null, 2),
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  type: "prepared_transaction",
                  description: result.description,
                  from: result.from,
                  to: result.to,
                  value: result.value,
                  gas: result.gas,
                  unsigned: result.unsigned,
                  note: "Transaction prepared - sign and submit with your preferred method"
                }, null, 2),
              },
            ],
          };
        }
      }
      
      case "heliswap_get_pair_info": {
        if (!heliSwapClient) throw new Error("HeliSwap client not initialized - Hedera credentials required");
        const typedArgs = validatedArgs as z.infer<typeof heliswapGetPairInfoSchema>;
        const { token0, token1 } = typedArgs;
        const result = await heliSwapClient.getPairInfo(token0, token1);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
      
      case "hashport_get_supported_assets": {
        if (!hashportClient) throw new Error("Hashport client not initialized");
        const typedArgs = validatedArgs as z.infer<typeof hashportGetSupportedAssetsSchema>;
        const { sourceNetwork, targetNetwork } = typedArgs;
        const result = await hashportClient.getSupportedAssets(sourceNetwork, targetNetwork);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
      
      case "hashport_get_supported_networks": {
        if (!hashportClient) throw new Error("Hashport client not initialized");
        const result = await hashportClient.getSupportedNetworks();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "hashport_get_bridge_steps": {
        if (!hashportClient) throw new Error("Hashport client not initialized");
        const typedArgs = validatedArgs as z.infer<typeof hashportGetBridgeStepsSchema>;
        const result = await hashportClient.getBridgeSteps(typedArgs);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "hashport_validate_bridge": {
        if (!hashportClient) throw new Error("Hashport client not initialized");
        const typedArgs = validatedArgs as z.infer<typeof hashportValidateBridgeSchema>;
        const result = await hashportClient.validateBridge(typedArgs);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "hashport_get_assets_amounts": {
        if (!hashportClient) throw new Error("Hashport client not initialized");
        const result = await hashportClient.getAssetsAmounts();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "hashport_get_transfers": {
        if (!hashportClient) throw new Error("Hashport client not initialized");
        const typedArgs = validatedArgs as z.infer<typeof hashportGetTransfersSchema>;
        const result = await hashportClient.getTransfers(typedArgs);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "hashport_get_network_assets": {
        if (!hashportClient) throw new Error("Hashport client not initialized");
        const typedArgs = validatedArgs as z.infer<typeof hashportGetNetworkAssetsSchema>;
        const result = await hashportClient.getNetworkAssets(typedArgs.networkId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "hashport_get_network_asset_amounts": {
        if (!hashportClient) throw new Error("Hashport client not initialized");
        const typedArgs = validatedArgs as z.infer<typeof hashportGetNetworkAssetAmountsSchema>;
        const result = await hashportClient.getNetworkAssetAmounts(typedArgs.networkId, typedArgs.assetId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "hashport_get_network_asset_details": {
        if (!hashportClient) throw new Error("Hashport client not initialized");
        const typedArgs = validatedArgs as z.infer<typeof hashportGetNetworkAssetDetailsSchema>;
        const result = await hashportClient.getNetworkAssetDetails(typedArgs.networkId, typedArgs.assetId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "hashport_convert_hedera_tx_id": {
        if (!hashportClient) throw new Error("Hashport client not initialized");
        const typedArgs = validatedArgs as z.infer<typeof hashportConvertHederaTxIdSchema>;
        const result = await hashportClient.convertHederaTxId(typedArgs.txId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  try {
    initializeClients();
  } catch (error) {
    console.error("Failed to initialize clients:", error);
    process.exit(1);
  }
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("KawaFi MCP Server running on stdio");
}

main().catch(console.error);