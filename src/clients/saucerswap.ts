import axios, { AxiosInstance } from "axios";

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
      timeout: 10000, // 10 second timeout
    });
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
}