import axios, { AxiosInstance } from "axios";

export interface SwapQuoteParams {
  tokenIn: string;
  tokenOut: string;
  amount: string;
  slippageTolerance?: number;
}

export interface PoolInfo {
  id: string;
  token0: string;
  token1: string;
  fee?: string;
  liquidity?: string;
  sqrtPriceX96?: string;
  tick?: number;
}

export interface FarmInfo {
  id: string;
  poolId: string;
  rewardToken: string;
  active: boolean;
  totalStaked: string;
  rewardRate: string;
}

export class SaucerSwapClient {
  private api: AxiosInstance;
  
  constructor(apiKey: string, testnet: boolean = false) {
    const baseURL = testnet 
      ? "https://test-api.saucerswap.finance"
      : "https://api.saucerswap.finance";
    
    this.api = axios.create({
      baseURL,
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });
  }

  async getTokens() {
    const response = await this.api.get("/tokens");
    return response.data;
  }

  async getV2SwapQuote(params: SwapQuoteParams) {
    const response = await this.api.get("/v2/swap/quote", {
      params: {
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amount: params.amount,
        slippageTolerance: params.slippageTolerance || 0.005,
      },
    });
    return response.data;
  }

  async getV1SwapQuote(params: SwapQuoteParams) {
    const response = await this.api.get("/v1/swap/quote", {
      params: {
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amount: params.amount,
        slippageTolerance: params.slippageTolerance || 0.005,
      },
    });
    return response.data;
  }

  async getV2Pools(token0?: string, token1?: string) {
    const params: any = {};
    if (token0) params.token0 = token0;
    if (token1) params.token1 = token1;
    
    const response = await this.api.get("/v2/pools", { params });
    return response.data;
  }

  async getV1Pools(token0?: string, token1?: string) {
    const params: any = {};
    if (token0) params.token0 = token0;
    if (token1) params.token1 = token1;
    
    const response = await this.api.get("/v1/pools", { params });
    return response.data;
  }

  async getFarms(active?: boolean) {
    const params: any = {};
    if (active !== undefined) params.active = active;
    
    const response = await this.api.get("/farms", { params });
    return response.data;
  }
}