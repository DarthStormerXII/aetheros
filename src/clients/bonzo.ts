import axios, { AxiosInstance } from "axios";

export interface Reserve {
  id: string;
  symbol: string;
  decimals: number;
  ltv: string;
  liquidationThreshold: string;
  liquidationPenalty: string;
  borrowingEnabled: boolean;
  stableBorrowRateEnabled: boolean;
  isActive: boolean;
  isFrozen: boolean;
  totalLiquidity: string;
  availableLiquidity: string;
  totalBorrows: string;
  supplyAPY: string;
  borrowAPY: string;
}

export interface AccountPosition {
  accountId: string;
  healthFactor: string;
  totalCollateralETH: string;
  totalDebtETH: string;
  availableBorrowsETH: string;
  ltv: string;
  deposits: Array<{
    reserve: string;
    amount: string;
    amountETH: string;
  }>;
  borrows: Array<{
    reserve: string;
    amount: string;
    amountETH: string;
    borrowRate: string;
    borrowRateMode: string;
  }>;
}

export interface LiquidationCandidate {
  accountId: string;
  healthFactor: string;
  totalCollateralETH: string;
  totalDebtETH: string;
  maxLiquidatableDebt: string;
}

export class BonzoFinanceClient {
  private api: AxiosInstance;
  
  constructor(testnet: boolean = false) {
    const baseURL = testnet 
      ? "https://test-api.bonzo.finance/v1"
      : "https://api.bonzo.finance/v1";
    
    this.api = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async getReserves(): Promise<Reserve[]> {
    const response = await this.api.get("/reserves");
    return response.data;
  }

  async getAccountPosition(accountId: string): Promise<AccountPosition> {
    const response = await this.api.get(`/accounts/${accountId}`);
    return response.data;
  }

  async getLiquidationCandidates(): Promise<LiquidationCandidate[]> {
    const response = await this.api.get("/accounts/debt");
    return response.data;
  }

  async getProtocolConfiguration() {
    const response = await this.api.get("/protocol");
    return response.data;
  }
}