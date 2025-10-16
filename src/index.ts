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
    name: "hedera-defi-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define Zod schemas for each tool
const saucerswapGetQuoteSchema = z.object({
  tokenIn: z.string().describe("Address of token to swap from"),
  tokenOut: z.string().describe("Address of token to swap to"),
  amount: z.string().describe("Amount to swap (in smallest unit)"),
  slippageTolerance: z.number().optional().describe("Slippage tolerance (e.g., 0.005 for 0.5%)"),
}).strict();

const saucerswapGetPoolsSchema = z.object({
  version: z.enum(["v1", "v2"]).describe("Pool version"),
  token0: z.string().optional().describe("Filter by token0 address"),
  token1: z.string().optional().describe("Filter by token1 address"),
}).strict();

const saucerswapGetFarmsSchema = z.object({
  active: z.boolean().optional().describe("Filter for active farms only"),
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

const hashportGetBridgeQuoteSchema = z.object({
  sourceNetworkId: z.string().describe("Source network ID"),
  targetNetworkId: z.string().describe("Target network ID"),
  sourceAssetId: z.string().describe("Asset ID on source network"),
  amount: z.string().describe("Amount to bridge"),
  recipient: z.string().describe("Recipient address on target network"),
}).strict();

const TOOLS: Tool[] = [
  {
    name: "saucerswap_get_quote",
    description: "Get a swap quote from SaucerSwap V2",
    inputSchema: zodToJsonSchema(saucerswapGetQuoteSchema) as any,
  },
  {
    name: "saucerswap_get_pools",
    description: "Get liquidity pool information from SaucerSwap",
    inputSchema: zodToJsonSchema(saucerswapGetPoolsSchema) as any,
  },
  {
    name: "saucerswap_get_farms",
    description: "Get yield farming opportunities from SaucerSwap",
    inputSchema: zodToJsonSchema(saucerswapGetFarmsSchema) as any,
  },
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
  {
    name: "heliswap_get_pair_info",
    description: "Get trading pair information from HeliSwap",
    inputSchema: zodToJsonSchema(heliswapGetPairInfoSchema) as any,
  },
  {
    name: "hashport_get_supported_assets",
    description: "Get list of assets supported by Hashport bridge",
    inputSchema: zodToJsonSchema(hashportGetSupportedAssetsSchema) as any,
  },
  {
    name: "hashport_get_bridge_quote",
    description: "Get a quote for bridging assets via Hashport",
    inputSchema: zodToJsonSchema(hashportGetBridgeQuoteSchema) as any,
  },
];

// Create a map of tool names to their Zod schemas for validation
const toolSchemas = {
  saucerswap_get_quote: saucerswapGetQuoteSchema,
  saucerswap_get_pools: saucerswapGetPoolsSchema,
  saucerswap_get_farms: saucerswapGetFarmsSchema,
  bonzo_get_reserves: bonzoGetReservesSchema,
  bonzo_get_account: bonzoGetAccountSchema,
  bonzo_get_liquidations: bonzoGetLiquidationsSchema,
  stader_get_exchange_rate: staderGetExchangeRateSchema,
  stader_stake_hbar: staderStakeHbarSchema,
  stader_unstake_hbarx: staderUnstakeHbarxSchema,
  heliswap_get_pair_info: heliswapGetPairInfoSchema,
  hashport_get_supported_assets: hashportGetSupportedAssetsSchema,
  hashport_get_bridge_quote: hashportGetBridgeQuoteSchema,
} as const;

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
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
  
  // SaucerSwap - only initialize if API key is provided
  if (process.env.SAUCERSWAP_API_KEY) {
    saucerSwapClient = new SaucerSwapClient(process.env.SAUCERSWAP_API_KEY, isTestnet);
    console.error("SaucerSwap client initialized");
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
  operatorAccountId = process.env.HEDERA_OPERATOR_ID || null;
  
  // Hedera-based services (Stader, HeliSwap)
  if (operatorAccountId) {
    try {
      hederaClient = isTestnet ? Client.forTestnet() : Client.forMainnet();
      
      if (executeTransactions) {
        // Full execution mode - requires private key
        if (!process.env.HEDERA_OPERATOR_KEY) {
          throw new Error("EXECUTE_TX=true requires HEDERA_OPERATOR_KEY");
        }
        
        hederaClient.setOperator(
          operatorAccountId,
          process.env.HEDERA_OPERATOR_KEY
        );
        
        console.error("⚠️  WARNING: Transaction EXECUTION enabled - private key loaded");
        console.error("⚠️  Using account:", operatorAccountId);
      } else {
        // Prepare-only mode - no private key needed
        console.error("📝 Transaction PREPARATION mode - will return unsigned transactions");
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
      case "saucerswap_get_quote": {
        if (!saucerSwapClient) throw new Error("SaucerSwap client not initialized");
        const typedArgs = validatedArgs as z.infer<typeof saucerswapGetQuoteSchema>;
        const result = await saucerSwapClient.getV2SwapQuote(typedArgs);
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
        const typedArgs = validatedArgs as z.infer<typeof saucerswapGetPoolsSchema>;
        const { version, token0, token1 } = typedArgs;
        const result = version === "v1" 
          ? await saucerSwapClient.getV1Pools(token0, token1)
          : await saucerSwapClient.getV2Pools(token0, token1);
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
        const typedArgs = validatedArgs as z.infer<typeof saucerswapGetFarmsSchema>;
        const { active } = typedArgs;
        const result = await saucerSwapClient.getFarms(active);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
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
        const result = await bonzoClient.getAccountPosition(accountId);
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
      
      case "hashport_get_bridge_quote": {
        if (!hashportClient) throw new Error("Hashport client not initialized");
        const typedArgs = validatedArgs as z.infer<typeof hashportGetBridgeQuoteSchema>;
        const result = await hashportClient.getBridgeQuote(typedArgs);
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
  console.error("Hedera DeFi MCP Server running on stdio");
}

main().catch(console.error);