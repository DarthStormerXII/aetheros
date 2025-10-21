import axios, { AxiosInstance } from "axios";
import { 
  Client, 
  ContractCallQuery,
  ContractExecuteTransaction,
  Hbar,
  AccountId,
  ContractId,
  Status,
  ContractFunctionParameters,
  Long,
  HbarUnit
} from "@hashgraph/sdk";
import { ethers } from "ethers";

export interface TokenInfo {
  id: string;
  icon: string;
  symbol: string;
  decimals: number;
  price: string;
  priceUsd: number;
  dueDiligenceComplete: boolean;
  isFeeOnTransferToken: boolean;
}

export interface PlatformStats {
  circulatingSauce: string;
  swapTotal: number;
  tvl: string;
  tvlUsd: number;
  volumeTotal: string;
  volumeTotalUsd: number;
}

export interface SingleSidedStakingStats {
  avg5day: number;
  ratio: number;
  sauce: string;
  timestampSeconds: number;
  xsauce: string;
}

export interface FarmInfo {
  id: number;
  poolId: number;
  sauceEmissions: number;
  hbarEmissions: number;
  totalStaked: string;
}

export interface HbarPricePoint {
  timestamp: number;
  price: number;
}

export interface PlatformDataPoint {
  timestamp: number;
  value: number;
}

export interface FarmAccountTotal {
  farmId: number;
  poolId: number;
  stakedAmount: string;
}

export interface PoolToken {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  priceUsd: number;
}

export interface PoolInfo {
  poolId: number;
  contractId: string;
  lpToken: PoolToken & {
    price: string;
  };
  lpTokenReserve: string;
  tokenA: PoolToken & {
    price: string;
  };
  tokenAReserve: string;
  tokenB: PoolToken & {
    price: string;
  };
  tokenBReserve: string;
}

export interface DefaultTokenInfo {
  id: string;
  symbol: string;
  priceUsd: number;
  liquidityUsd: number;
  priceChangeHour: number;
  priceChangeDay: number;
  priceChangeWeek: number;
}

export interface V2PoolInfo {
  poolId: number;
  contractId: string;
  tokenA: PoolToken & {
    price: string;
    isFeeOnTransferToken: boolean;
    dueDiligenceComplete: boolean;
  };
  tokenAAmount: string;
  tokenB: PoolToken & {
    price: string;
    isFeeOnTransferToken: boolean;
    dueDiligenceComplete: boolean;
  };
  tokenBAmount: string;
  fee: number;
  sqrtRatioX96: string;
  tick: number;
  liquidity: string;
}

export interface PreparedTransaction {
  type: "prepared";
  description: string;
  from: string;
  to: string;
  function: string;
  params: any;
  value?: string;
  gas: number;
  unsigned: {
    contractId: string;
    functionName: string;
    functionParams: any;
    payableAmount?: string;
  };
}

export interface ExecutedTransaction {
  type: "executed";
  transactionId: string;
  status: string;
}

export type TransactionResult = PreparedTransaction | ExecutedTransaction;

export interface SwapQuote {
  amountOut: string;
  sqrtPriceX96AfterList: string[];
  initializedTicksCrossedList: number[];
  gasEstimate: string;
}

export interface SwapQuoteOutput {
  amountIn: string;
  sqrtPriceX96AfterList: string[];
  initializedTicksCrossedList: number[];
  gasEstimate: string;
}

// Contract addresses
export const SAUCERSWAP_CONTRACTS = {
  mainnet: {
    quoterV2: "0x00000000000000000000000000000000003c4eb0", // 0.0.3949424
    swapRouter: "0x00000000000000000000000000000000003c4eba", // 0.0.3949434
    nftManager: "0x00000000000000000000000000000000003de339", // 0.0.4053945
    mothership: "0x0000000000000000000000000000000000164d07", // 0.0.1460199
    masterchef: "0x0000000000000000000000000000000000107123", // 0.0.1077627
    whbar: "0x0000000000000000000000000000000000163b59", // 0.0.1456985
    sauce: "0x00000000000000000000000000000000000b2ad5", // 0.0.731861
    xsauce: "0x0000000000000000000000000000000000164d08"  // 0.0.1460200
  },
  testnet: {
    quoterV2: "0x0000000000000000000000000000000000153532", // 0.0.1390002
    swapRouter: "0x0000000000000000000000000000000000159428", // 0.0.1414040
    nftManager: "0x00000000000000000000000000000000001fea68", // 0.0.1308184
    mothership: "0x00000000000000000000000000000000001599aa", // 0.0.1418650
    masterchef: "0x0000000000000000000000000000000000120213", // 0.0.1179171
    whbar: "0x0000000000000000000000000000000000003ad1", // 0.0.15057
    sauce: "0x0000000000000000000000000000000000120e26", // 0.0.1183558
    xsauce: "0x00000000000000000000000000000000001599ab"  // 0.0.1418651
  }
};

// ABIs
const QUOTER_V2_ABI = [
  "function quoteExactInput(bytes memory path, uint256 amountIn) external returns (uint256 amountOut, uint160[] memory sqrtPriceX96AfterList, uint32[] memory initializedTicksCrossedList, uint256 gasEstimate)",
  "function quoteExactOutput(bytes memory path, uint256 amountOut) external returns (uint256 amountIn, uint160[] memory sqrtPriceX96AfterList, uint32[] memory initializedTicksCrossedList, uint256 gasEstimate)"
];

const SWAP_ROUTER_ABI = [
  "function exactInput(tuple(bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum) params) external payable returns (uint256 amountOut)",
  "function exactOutput(tuple(bytes path, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum) params) external payable returns (uint256 amountIn)",
  "function multicall(bytes[] calldata data) external payable returns (bytes[] memory results)",
  "function refundETH() external payable",
  "function unwrapWHBAR(uint256 amountMinimum, address recipient) external payable"
];

const MOTHERSHIP_ABI = [
  "function sauceForxSauce(uint256 _sauceAmount) external view returns (uint256 xSauceAmount_)",
  "function xSauceForSauce(uint256 _xSauceAmount) external view returns (uint256 sauceAmount_)",
  "function enter(uint256 _amount) external",
  "function leave(uint256 _share) external"
];

const MASTERCHEF_ABI = [
  "function pendingSauce(uint256 _pid, address _user) external view returns (uint256, uint256)",
  "function deposit(uint256 _pid, uint256 _amount) external payable",
  "function withdraw(uint256 _pid, uint256 _amount) external",
  "function depositFee() external view returns (uint256)"
];

export class SaucerSwapClient {
  private api: AxiosInstance;
  private client?: Client;
  private testnet: boolean;
  private executeMode: boolean;
  private accountId?: string;
  private quoterInterface: ethers.Interface;
  private swapRouterInterface: ethers.Interface;
  private mothershipInterface: ethers.Interface;
  private masterchefInterface: ethers.Interface;
  
  constructor(
    apiKey: string, 
    testnet: boolean = false, 
    client?: Client, 
    executeMode: boolean = false, 
    accountId?: string
  ) {
    const baseURL = testnet 
      ? "https://test-api.saucerswap.finance"
      : "https://api.saucerswap.finance";
    
    this.api = axios.create({
      baseURL,
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      timeout: 10000, // 10 second timeout
    });
    
    this.testnet = testnet;
    this.client = client;
    this.executeMode = executeMode;
    this.accountId = accountId;
    
    // Initialize contract interfaces
    this.quoterInterface = new ethers.Interface(QUOTER_V2_ABI);
    this.swapRouterInterface = new ethers.Interface(SWAP_ROUTER_ABI);
    this.mothershipInterface = new ethers.Interface(MOTHERSHIP_ABI);
    this.masterchefInterface = new ethers.Interface(MASTERCHEF_ABI);
  }

  async getTokens(): Promise<TokenInfo[]> {
    const response = await this.api.get("/tokens");
    return response.data;
  }

  async getStats(): Promise<PlatformStats> {
    const response = await this.api.get("/stats");
    return response.data;
  }

  async getSingleSidedStakingStats(): Promise<SingleSidedStakingStats> {
    const response = await this.api.get("/stats/sss");
    return response.data;
  }

  async getHbarHistoricalPrices(fromSeconds: number, toSeconds: number): Promise<HbarPricePoint[]> {
    const response = await this.api.get("/stats/hbarHistoricalPrices", {
      params: {
        from: fromSeconds,
        to: toSeconds
      }
    });
    return response.data;
  }

  async getPlatformData(
    fromSeconds: number,
    toSeconds: number,
    interval: 'HOUR' | 'DAY' | 'WEEK' = 'HOUR',
    field: 'LIQUIDITY' | 'VOLUME' = 'LIQUIDITY'
  ): Promise<PlatformDataPoint[]> {
    const response = await this.api.get("/stats/platformData", {
      params: {
        from: fromSeconds,
        to: toSeconds,
        interval,
        field
      }
    });
    return response.data;
  }

  async getFarms(): Promise<FarmInfo[]> {
    const response = await this.api.get("/farms");
    return response.data;
  }

  async getFarmsByAccount(accountId: string): Promise<FarmAccountTotal[]> {
    const response = await this.api.get(`/farms/totals/${accountId}`);
    return response.data;
  }

  async getPools(): Promise<PoolInfo[]> {
    const response = await this.api.get("/pools");
    return response.data;
  }

  async getDefaultTokens(): Promise<DefaultTokenInfo[]> {
    const response = await this.api.get("/tokens/default");
    return response.data;
  }

  async getV2Pools(): Promise<V2PoolInfo[]> {
    const response = await this.api.get("/pools-v2/pools");
    return response.data;
  }

  // Helper methods for common queries
  async getTokenBySymbol(symbol: string): Promise<TokenInfo | undefined> {
    const tokens = await this.getTokens();
    return tokens.find(token => token.symbol.toLowerCase() === symbol.toLowerCase());
  }

  async getActiveFarms(): Promise<FarmInfo[]> {
    const farms = await this.getFarms();
    return farms.filter(farm => farm.sauceEmissions > 0 || farm.hbarEmissions > 0);
  }

  async getTvlUsd(): Promise<number> {
    const stats = await this.getStats();
    return stats.tvlUsd;
  }

  // Helper methods for contract interactions
  private getContracts() {
    return this.testnet ? SAUCERSWAP_CONTRACTS.testnet : SAUCERSWAP_CONTRACTS.mainnet;
  }

  private requireContractMode() {
    if (!this.client) {
      throw new Error("Contract interactions require a Hedera client");
    }
    if (!this.accountId) {
      throw new Error("Contract interactions require an account ID");
    }
  }

  private encodePath(tokens: string[], fees: number[]): string {
    if (tokens.length !== fees.length + 1) {
      throw new Error("Invalid path: tokens and fees length mismatch");
    }
    
    let path = tokens[0].replace('0x', '');
    for (let i = 0; i < fees.length; i++) {
      const feeHex = fees[i].toString(16).padStart(6, '0');
      path += feeHex + tokens[i + 1].replace('0x', '');
    }
    
    return '0x' + path;
  }

  private hexToUint8Array(hex: string): Uint8Array {
    const cleanHex = hex.replace('0x', '');
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
    }
    return bytes;
  }

  private accountIdToEvmAddress(accountId: string): string {
    // Convert Hedera account ID (0.0.123456) to EVM address format
    if (accountId.startsWith('0.0.')) {
      const accountNum = parseInt(accountId.split('.')[2]);
      // Pad to 20 bytes (40 hex chars) with leading zeros
      return '0x' + accountNum.toString(16).padStart(40, '0');
    }
    // If already in EVM format, return as is
    return accountId;
  }

  // Quote methods
  async quoteExactInput(
    tokens: string[], 
    fees: number[], 
    amountIn: string
  ): Promise<SwapQuote> {
    this.requireContractMode();
    
    try {
      const contracts = this.getContracts();
      const quoterId = ContractId.fromEvmAddress(0, 0, contracts.quoterV2);
      const pathData = this.encodePath(tokens, fees);
      
      const query = new ContractCallQuery()
        .setContractId(quoterId)
        .setGas(200_000)
        .setFunction("quoteExactInput",
          new ContractFunctionParameters()
            .addBytes(this.hexToUint8Array(pathData))
            .addUint256(Long.fromString(amountIn))
        );
      
      const result = await query.execute(this.client!);
      
      return {
        amountOut: result.getUint256(0).toString(),
        sqrtPriceX96AfterList: [], // TODO: Parse array results
        initializedTicksCrossedList: [], // TODO: Parse array results  
        gasEstimate: result.getUint256(3).toString()
      };
    } catch (error) {
      throw new Error(`Failed to get quote for exact input: ${error}`);
    }
  }

  async quoteExactOutput(
    tokens: string[], 
    fees: number[], 
    amountOut: string
  ): Promise<SwapQuoteOutput> {
    this.requireContractMode();
    
    try {
      const contracts = this.getContracts();
      const quoterId = ContractId.fromEvmAddress(0, 0, contracts.quoterV2);
      
      // Reverse path for exact output
      const reversedTokens = [...tokens].reverse();
      const reversedFees = [...fees].reverse();
      const pathData = this.encodePath(reversedTokens, reversedFees);
      
      const query = new ContractCallQuery()
        .setContractId(quoterId)
        .setGas(200_000)
        .setFunction("quoteExactOutput",
          new ContractFunctionParameters()
            .addBytes(this.hexToUint8Array(pathData))
            .addUint256(Long.fromString(amountOut))
        );
      
      const result = await query.execute(this.client!);
      
      return {
        amountIn: result.getUint256(0).toString(),
        sqrtPriceX96AfterList: [], // TODO: Parse array results
        initializedTicksCrossedList: [], // TODO: Parse array results
        gasEstimate: result.getUint256(3).toString()
      };
    } catch (error) {
      throw new Error(`Failed to get quote for exact output: ${error}`);
    }
  }

  // Swap methods
  async swapExactHbarForTokens(
    outputToken: string,
    fee: number,
    amountIn: string,
    amountOutMinimum: string,
    recipient?: string,
    deadline?: number
  ): Promise<TransactionResult> {
    this.requireContractMode();
    
    try {
      const contracts = this.getContracts();
      const swapRouterId = ContractId.fromEvmAddress(0, 0, contracts.swapRouter);
      const recipientAddress = this.accountIdToEvmAddress(recipient || this.accountId!);
      const swapDeadline = deadline || Math.floor(Date.now() / 1000) + 1800; // 30 min default
      
      // Path: WHBAR -> outputToken
      const pathData = this.encodePath([contracts.whbar, outputToken], [fee]);
      
      const params = {
        path: pathData,
        recipient: recipientAddress,
        deadline: swapDeadline,
        amountIn: amountIn,
        amountOutMinimum: amountOutMinimum
      };
      
      const swapEncoded = this.swapRouterInterface.encodeFunctionData('exactInput', [params]);
      const refundEncoded = this.swapRouterInterface.encodeFunctionData('refundETH');
      const multiCallData = this.swapRouterInterface.encodeFunctionData('multicall', [[swapEncoded, refundEncoded]]);
      
      if (this.executeMode) {
        const transaction = new ContractExecuteTransaction()
          .setContractId(swapRouterId)
          .setGas(400_000)
          .setPayableAmount(Hbar.from(amountIn, HbarUnit.Tinybar))
          .setFunctionParameters(this.hexToUint8Array(multiCallData));
          
        const response = await transaction.execute(this.client!);
        const receipt = await response.getReceipt(this.client!);
        
        if (receipt.status !== Status.Success) {
          throw new Error(`Swap transaction failed: ${receipt.status}`);
        }
        
        return {
          type: "executed",
          transactionId: response.transactionId.toString(),
          status: "success"
        };
      } else {
        return {
          type: "prepared",
          description: `Swap ${amountIn} tinybar HBAR for minimum ${amountOutMinimum} ${outputToken}`,
          from: this.accountId!,
          to: contracts.swapRouter,
          function: "multicall(bytes[])",
          params: { swapParams: params, includeRefund: true },
          value: amountIn,
          gas: 400_000,
          unsigned: {
            contractId: contracts.swapRouter,
            functionName: "multicall",
            functionParams: [[swapEncoded, refundEncoded]],
            payableAmount: amountIn
          }
        };
      }
    } catch (error) {
      throw new Error(`Failed to ${this.executeMode ? 'swap' : 'prepare swap of'} HBAR for tokens: ${error}`);
    }
  }

  async swapExactTokensForHbar(
    inputToken: string,
    fee: number,
    amountIn: string,
    amountOutMinimum: string,
    recipient?: string,
    deadline?: number
  ): Promise<TransactionResult> {
    this.requireContractMode();
    
    try {
      const contracts = this.getContracts();
      const swapRouterId = ContractId.fromEvmAddress(0, 0, contracts.swapRouter);
      const recipientAddress = this.accountIdToEvmAddress(recipient || this.accountId!);
      const swapDeadline = deadline || Math.floor(Date.now() / 1000) + 1800;
      
      // Path: inputToken -> WHBAR
      const pathData = this.encodePath([inputToken, contracts.whbar], [fee]);
      
      const params = {
        path: pathData,
        recipient: contracts.swapRouter, // Use router address for unwrap
        deadline: swapDeadline,
        amountIn: amountIn,
        amountOutMinimum: amountOutMinimum
      };
      
      const swapEncoded = this.swapRouterInterface.encodeFunctionData('exactInput', [params]);
      const unwrapEncoded = this.swapRouterInterface.encodeFunctionData('unwrapWHBAR', [0, recipientAddress]);
      const multiCallData = this.swapRouterInterface.encodeFunctionData('multicall', [[swapEncoded, unwrapEncoded]]);
      
      if (this.executeMode) {
        const transaction = new ContractExecuteTransaction()
          .setContractId(swapRouterId)
          .setGas(400_000)
          .setFunctionParameters(this.hexToUint8Array(multiCallData));
          
        const response = await transaction.execute(this.client!);
        const receipt = await response.getReceipt(this.client!);
        
        if (receipt.status !== Status.Success) {
          throw new Error(`Swap transaction failed: ${receipt.status}`);
        }
        
        return {
          type: "executed",
          transactionId: response.transactionId.toString(),
          status: "success"
        };
      } else {
        return {
          type: "prepared",
          description: `Swap ${amountIn} ${inputToken} for minimum ${amountOutMinimum} tinybar HBAR`,
          from: this.accountId!,
          to: contracts.swapRouter,
          function: "multicall(bytes[])",
          params: { swapParams: params, includeUnwrap: true, recipient: recipientAddress },
          value: "0",
          gas: 400_000,
          unsigned: {
            contractId: contracts.swapRouter,
            functionName: "multicall",
            functionParams: [[swapEncoded, unwrapEncoded]],
            payableAmount: "0"
          }
        };
      }
    } catch (error) {
      throw new Error(`Failed to ${this.executeMode ? 'swap' : 'prepare swap of'} tokens for HBAR: ${error}`);
    }
  }

  async swapExactTokensForTokens(
    inputToken: string,
    outputToken: string,
    fees: number[],
    amountIn: string,
    amountOutMinimum: string,
    recipient?: string,
    deadline?: number
  ): Promise<TransactionResult> {
    this.requireContractMode();
    
    try {
      const contracts = this.getContracts();
      const swapRouterId = ContractId.fromEvmAddress(0, 0, contracts.swapRouter);
      const recipientAddress = this.accountIdToEvmAddress(recipient || this.accountId!);
      const swapDeadline = deadline || Math.floor(Date.now() / 1000) + 1800;
      
      // Path: inputToken -> [intermediate tokens] -> outputToken
      const tokens = [inputToken, outputToken]; // Simplified - would need intermediate tokens for multi-hop
      const pathData = this.encodePath(tokens, fees);
      
      const params = {
        path: pathData,
        recipient: recipientAddress,
        deadline: swapDeadline,
        amountIn: amountIn,
        amountOutMinimum: amountOutMinimum
      };
      
      const encodedData = this.swapRouterInterface.encodeFunctionData('exactInput', [params]);
      
      if (this.executeMode) {
        const transaction = new ContractExecuteTransaction()
          .setContractId(swapRouterId)
          .setGas(350_000)
          .setFunctionParameters(this.hexToUint8Array(encodedData));
          
        const response = await transaction.execute(this.client!);
        const receipt = await response.getReceipt(this.client!);
        
        if (receipt.status !== Status.Success) {
          throw new Error(`Swap transaction failed: ${receipt.status}`);
        }
        
        return {
          type: "executed",
          transactionId: response.transactionId.toString(),
          status: "success"
        };
      } else {
        return {
          type: "prepared",
          description: `Swap ${amountIn} ${inputToken} for minimum ${amountOutMinimum} ${outputToken}`,
          from: this.accountId!,
          to: contracts.swapRouter,
          function: "exactInput(ExactInputParams)",
          params: params,
          value: "0",
          gas: 350_000,
          unsigned: {
            contractId: contracts.swapRouter,
            functionName: "exactInput",
            functionParams: params,
            payableAmount: "0"
          }
        };
      }
    } catch (error) {
      throw new Error(`Failed to ${this.executeMode ? 'swap' : 'prepare swap of'} tokens for tokens: ${error}`);
    }
  }

  // Single-sided staking methods
  async stakeSauceForXSauce(amount: string): Promise<TransactionResult> {
    this.requireContractMode();
    
    try {
      const contracts = this.getContracts();
      const mothershipId = ContractId.fromEvmAddress(0, 0, contracts.mothership);
      
      const encodedData = this.mothershipInterface.encodeFunctionData('enter', [amount]);
      
      if (this.executeMode) {
        const transaction = new ContractExecuteTransaction()
          .setContractId(mothershipId)
          .setGas(150_000)
          .setFunctionParameters(this.hexToUint8Array(encodedData));
          
        const response = await transaction.execute(this.client!);
        const receipt = await response.getReceipt(this.client!);
        
        if (receipt.status !== Status.Success) {
          throw new Error(`Stake transaction failed: ${receipt.status}`);
        }
        
        return {
          type: "executed",
          transactionId: response.transactionId.toString(),
          status: "success"
        };
      } else {
        return {
          type: "prepared",
          description: `Stake ${amount} SAUCE for xSAUCE`,
          from: this.accountId!,
          to: contracts.mothership,
          function: "enter(uint256)",
          params: { amount },
          value: "0",
          gas: 150_000,
          unsigned: {
            contractId: contracts.mothership,
            functionName: "enter",
            functionParams: amount,
            payableAmount: "0"
          }
        };
      }
    } catch (error) {
      throw new Error(`Failed to ${this.executeMode ? 'stake' : 'prepare stake of'} SAUCE: ${error}`);
    }
  }

  async unstakeXSauceForSauce(amount: string): Promise<TransactionResult> {
    this.requireContractMode();
    
    try {
      const contracts = this.getContracts();
      const mothershipId = ContractId.fromEvmAddress(0, 0, contracts.mothership);
      
      const encodedData = this.mothershipInterface.encodeFunctionData('leave', [amount]);
      
      if (this.executeMode) {
        const transaction = new ContractExecuteTransaction()
          .setContractId(mothershipId)
          .setGas(150_000)
          .setFunctionParameters(this.hexToUint8Array(encodedData));
          
        const response = await transaction.execute(this.client!);
        const receipt = await response.getReceipt(this.client!);
        
        if (receipt.status !== Status.Success) {
          throw new Error(`Unstake transaction failed: ${receipt.status}`);
        }
        
        return {
          type: "executed",
          transactionId: response.transactionId.toString(),
          status: "success"
        };
      } else {
        return {
          type: "prepared",
          description: `Unstake ${amount} xSAUCE for SAUCE`,
          from: this.accountId!,
          to: contracts.mothership,
          function: "leave(uint256)",
          params: { amount },
          value: "0",
          gas: 150_000,
          unsigned: {
            contractId: contracts.mothership,
            functionName: "leave",
            functionParams: amount,
            payableAmount: "0"
          }
        };
      }
    } catch (error) {
      throw new Error(`Failed to ${this.executeMode ? 'unstake' : 'prepare unstake of'} xSAUCE: ${error}`);
    }
  }

  // Yield farming methods
  async depositLpTokensToFarm(
    poolId: number,
    amount: string,
    depositFeeHbar: string
  ): Promise<TransactionResult> {
    this.requireContractMode();
    
    try {
      const contracts = this.getContracts();
      const masterchefId = ContractId.fromEvmAddress(0, 0, contracts.masterchef);
      
      const encodedData = this.masterchefInterface.encodeFunctionData('deposit', [poolId, amount]);
      
      if (this.executeMode) {
        const transaction = new ContractExecuteTransaction()
          .setContractId(masterchefId)
          .setGas(300_000)
          .setPayableAmount(Hbar.from(depositFeeHbar, HbarUnit.Tinybar))
          .setFunctionParameters(this.hexToUint8Array(encodedData));
          
        const response = await transaction.execute(this.client!);
        const receipt = await response.getReceipt(this.client!);
        
        if (receipt.status !== Status.Success) {
          throw new Error(`Farm deposit transaction failed: ${receipt.status}`);
        }
        
        return {
          type: "executed",
          transactionId: response.transactionId.toString(),
          status: "success"
        };
      } else {
        return {
          type: "prepared",
          description: `Deposit ${amount} LP tokens to farm pool ${poolId}`,
          from: this.accountId!,
          to: contracts.masterchef,
          function: "deposit(uint256,uint256)",
          params: { poolId, amount },
          value: depositFeeHbar,
          gas: 300_000,
          unsigned: {
            contractId: contracts.masterchef,
            functionName: "deposit",
            functionParams: [poolId, amount],
            payableAmount: depositFeeHbar
          }
        };
      }
    } catch (error) {
      throw new Error(`Failed to ${this.executeMode ? 'deposit' : 'prepare deposit of'} LP tokens to farm: ${error}`);
    }
  }

  async withdrawLpTokensFromFarm(
    poolId: number,
    amount: string
  ): Promise<TransactionResult> {
    this.requireContractMode();
    
    try {
      const contracts = this.getContracts();
      const masterchefId = ContractId.fromEvmAddress(0, 0, contracts.masterchef);
      
      const encodedData = this.masterchefInterface.encodeFunctionData('withdraw', [poolId, amount]);
      
      if (this.executeMode) {
        const transaction = new ContractExecuteTransaction()
          .setContractId(masterchefId)
          .setGas(250_000)
          .setFunctionParameters(this.hexToUint8Array(encodedData));
          
        const response = await transaction.execute(this.client!);
        const receipt = await response.getReceipt(this.client!);
        
        if (receipt.status !== Status.Success) {
          throw new Error(`Farm withdraw transaction failed: ${receipt.status}`);
        }
        
        return {
          type: "executed",
          transactionId: response.transactionId.toString(),
          status: "success"
        };
      } else {
        return {
          type: "prepared",
          description: `Withdraw ${amount} LP tokens from farm pool ${poolId}`,
          from: this.accountId!,
          to: contracts.masterchef,
          function: "withdraw(uint256,uint256)",
          params: { poolId, amount },
          value: "0",
          gas: 250_000,
          unsigned: {
            contractId: contracts.masterchef,
            functionName: "withdraw",
            functionParams: [poolId, amount],
            payableAmount: "0"
          }
        };
      }
    } catch (error) {
      throw new Error(`Failed to ${this.executeMode ? 'withdraw' : 'prepare withdrawal of'} LP tokens from farm: ${error}`);
    }
  }
}