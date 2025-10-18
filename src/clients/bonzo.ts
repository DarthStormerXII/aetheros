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
  Long
} from "@hashgraph/sdk";
import { ethers } from "ethers";

// AAVE v2 ABIs for Bonzo Finance
const LENDING_POOL_ABI = [
  "function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)",
  "function withdraw(address asset, uint256 amount, address to) returns (uint256)",
  "function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)",
  "function repay(address asset, uint256 amount, uint256 rateMode, address onBehalfOf) returns (uint256)",
  "function setUserUseReserveAsCollateral(address asset, bool useAsCollateral)",
  "function liquidationCall(address collateralAsset, address debtAsset, address user, uint256 debtToCover, bool receiveAToken) returns (uint256, string memory)",
  "function getUserAccountData(address user) view returns (uint256 totalCollateralETH, uint256 totalDebtETH, uint256 availableBorrowsETH, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)",
  "function getReserveData(address asset) view returns (uint256 configuration, uint128 liquidityIndex, uint128 variableBorrowIndex, uint128 currentLiquidityRate, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint8 id)"
];

const PRICE_ORACLE_ABI = [
  "function getAssetPrice(address asset) view returns (uint256)",
  "function getAssetsPrices(address[] calldata assets) view returns (uint256[] memory)",
  "function getSourceOfAsset(address asset) view returns (address)",
  "function getFallbackOracle() view returns (address)"
];

const ATOKEN_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)"
];

// Contract addresses for mainnet and testnet
export const BONZO_CONTRACTS = {
  mainnet: {
    lendingPool: "0x236897c518996163E7b313aD21D1C9fCC7BA1afc",
    priceOracle: "0x9F1981afD19e2881A4Acb39aa144c7fBc4a6D8b3",
    dataProvider: "0x78feDC4D7010E409A0c0c7aF964cc517D3dCde18",
    wethGateway: "0x9a601543e9264255BebB20Cef0E7924e97127105"
  },
  testnet: {
    lendingPool: "0xf67DBe9bD1B331cA379c44b5562EAa1CE831EbC2",
    priceOracle: "0xF6e755380518589dE02f0F6BaA1D291C016992Cb", 
    dataProvider: "0x121A2AFFA5f595175E60E01EAeF0deC43Cc3b024",
    wethGateway: "0x16197Ef10F26De77C9873d075f8774BdEc20A75d"
  }
};

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

export interface UserAccountData {
  totalCollateralETH: string;
  totalDebtETH: string;
  availableBorrowsETH: string;
  currentLiquidationThreshold: string;
  ltv: string;
  healthFactor: string;
}

export interface ReserveData {
  configuration: string;
  liquidityIndex: string;
  variableBorrowIndex: string;
  currentLiquidityRate: string;
  currentVariableBorrowRate: string;
  currentStableBorrowRate: string;
  aTokenAddress: string;
  stableDebtTokenAddress: string;
  variableDebtTokenAddress: string;
  interestRateStrategyAddress: string;
}

export interface BalanceInfo {
  tiny_token: string;
  token_display: string;
  hbar_tinybar: string;
  hbar_display: string;
  usd_wad: string;
  usd_display: string;
}

export interface Reserve {
  id: number;
  name: string;
  symbol: string;
  coingecko_id: string;
  hts_address: string;
  evm_address: string;
  atoken_address: string;
  stable_debt_address: string;
  variable_debt_address: string;
  protocol_treasury_address: string;
  decimals: number;
  ltv: number;
  liquidation_threshold: number;
  liquidation_bonus: number;
  active: boolean;
  frozen: boolean;
  variable_borrowing_enabled: boolean;
  stable_borrowing_enabled: boolean;
  reserve_factor: number;
  token_balance?: BalanceInfo;
  atoken_balance?: BalanceInfo;
  stable_debt_balance?: BalanceInfo;
  variable_debt_balance?: BalanceInfo;
  available_liquidity: BalanceInfo;
  total_stable_debt: BalanceInfo;
  total_variable_debt: BalanceInfo;
  total_supply: BalanceInfo;
  borrow_cap: BalanceInfo;
  supply_cap: BalanceInfo;
  utilization_rate: number;
  supply_apy: number;
  variable_borrow_apy: number;
  stable_borrow_apy: number;
  use_as_collateral_enabled?: boolean;
  price_weibars: string;
  price_usd_wad: string;
  price_usd_display: string;
}

export interface UserCredit {
  hbar_balance: BalanceInfo;
  total_supply: BalanceInfo;
  total_collateral: BalanceInfo;
  total_debt: BalanceInfo;
  credit_limit: BalanceInfo;
  liquidation_ltv: number;
  current_ltv: number;
  max_ltv: number;
  health_factor: number;
}

export interface AccountDashboard {
  chain_id: string;
  network_name: string;
  hts_address: string;
  evm_address: string;
  reserves: Reserve[];
  average_supply_apy: number;
  average_borrow_apy: number;
  average_net_apy: number;
  user_credit: UserCredit;
  timestamp: string;
}

export interface MarketData {
  chain_id: string;
  network_name: string;
  reserves: Reserve[];
  timestamp: string;
}

export interface DebtorsResponse {
  chain_id: string;
  network_name: string;
  debtors: string[];
  timestamp: string;
}

export interface ProtocolStats {
  chain_id: string;
  network_name: string;
  total_supply_value: BalanceInfo;
  total_borrowed_value: BalanceInfo;
  total_liquidity_value: BalanceInfo;
  total_deposits_count: number;
  total_withdraws_count: number;
  total_borrows_count: number;
  total_repays_count: number;
  total_enable_collateral_count: number;
  total_disable_collateral_count: number;
  total_flash_loan_count: number;
  total_flash_loan_fees: BalanceInfo;
  total_liquidations_count: number;
  total_liquidation_payoffs: BalanceInfo;
  total_liquidation_rewards: BalanceInfo;
  total_liquidation_bonuses: BalanceInfo;
  total_protocol_fees: BalanceInfo;
  total_intrest_earned: BalanceInfo;
  total_gas_consumed: number;
  total_gas_charged: number;
  total_network_fees: number;
  total_successful_transactions: number;
  total_failed_transactions: number;
  active_users: string[];
  reserves: Reserve[];
  timestamp_start: string;
  timestamp_end: string;
}

export interface ProtocolInfo {
  chain_id: string;
  network_name: string;
  mirror_node: string;
  lending_pool_address: string;
  price_oracle_address: string;
  protocol_data_provider_address: string;
  lending_pool_configurator_address: string;
  whbar_hts_address: string;
  whbar_evm_address: string;
  reserves: Reserve[];
}

export interface BonzoTokenInfo {
  chain_id: string;
  network_name: string;
  token_id: string;
  symbol: string;
  name: string;
  memo: string;
  total_supply: string;
  circulating_supply: string;
  decimals: number;
  treasuries: Array<{
    address: string;
    name: string;
    balance: string;
  }>;
  timestamp: string;
}

export class BonzoFinanceClient {
  private api: AxiosInstance;
  private client?: Client;
  private testnet: boolean;
  private executeMode: boolean;
  private accountId?: string;
  private lendingPoolInterface: ethers.Interface;
  private priceOracleInterface: ethers.Interface;
  private aTokenInterface: ethers.Interface;
  
  constructor(
    testnet: boolean = false, 
    client?: Client, 
    executeMode: boolean = false, 
    accountId?: string
  ) {
    this.testnet = testnet;
    this.client = client;
    this.executeMode = executeMode;
    this.accountId = accountId;
    
    const baseURL = testnet 
      ? "https://testnet-data.bonzo.finance/"
      : "https://data.bonzo.finance/";
    
    this.api = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 15000, // 15 second timeout
    });

    this.lendingPoolInterface = new ethers.Interface(LENDING_POOL_ABI);
    this.priceOracleInterface = new ethers.Interface(PRICE_ORACLE_ABI);
    this.aTokenInterface = new ethers.Interface(ATOKEN_ABI);
  }

  async getMarketData(): Promise<MarketData> {
    const response = await this.api.get("/market");
    return response.data;
  }

  async getAccountDashboard(accountId: string): Promise<AccountDashboard> {
    const response = await this.api.get(`/dashboard/${accountId}`);
    return response.data;
  }

  async getDebtors(): Promise<DebtorsResponse> {
    const response = await this.api.get("/debtors");
    return response.data;
  }

  async getProtocolStats(): Promise<ProtocolStats> {
    const response = await this.api.get("/stats");
    return response.data;
  }

  async getProtocolInfo(): Promise<ProtocolInfo> {
    const response = await this.api.get("/info");
    return response.data;
  }

  async getBonzoTokenInfo(): Promise<BonzoTokenInfo> {
    const response = await this.api.get("/bonzo");
    return response.data;
  }

  async getBonzoCirculatingSupply(): Promise<string> {
    const response = await this.api.get("/bonzo/circulation");
    return response.data;
  }

  // Helper methods for easier data access
  async getLiquidationCandidates(): Promise<string[]> {
    const debtorsResponse = await this.getDebtors();
    return debtorsResponse.debtors;
  }

  async getReserves(): Promise<Reserve[]> {
    const marketData = await this.getMarketData();
    return marketData.reserves;
  }

  // Contract interaction methods
  private getContracts() {
    return this.testnet ? BONZO_CONTRACTS.testnet : BONZO_CONTRACTS.mainnet;
  }

  private requireContractMode() {
    if (!this.client) {
      throw new Error("Contract interactions require a Hedera client");
    }
    if (!this.accountId) {
      throw new Error("Contract interactions require an account ID");
    }
  }

  async deposit(asset: string, amount: string, onBehalfOf?: string): Promise<TransactionResult> {
    this.requireContractMode();
    
    try {
      const contracts = this.getContracts();
      const lendingPoolId = ContractId.fromEvmAddress(0, 0, contracts.lendingPool);
      const recipient = onBehalfOf || this.accountId!;
      
      const transaction = new ContractExecuteTransaction()
        .setContractId(lendingPoolId)
        .setGas(300_000)
        .setFunction("deposit",
          new ContractFunctionParameters()
            .addAddress(asset)
            .addUint256(Long.fromString(amount))
            .addAddress(recipient)
            .addUint256(0) // referralCode
        );
      
      if (this.executeMode) {
        const response = await transaction.execute(this.client!);
        const receipt = await response.getReceipt(this.client!);
        
        if (receipt.status !== Status.Success) {
          throw new Error(`Deposit transaction failed: ${receipt.status}`);
        }
        
        return {
          type: "executed",
          transactionId: response.transactionId.toString(),
          status: "success"
        };
      } else {
        return {
          type: "prepared",
          description: `Deposit ${amount} of ${asset} to Bonzo Finance`,
          from: this.accountId!,
          to: contracts.lendingPool,
          function: "deposit(address,uint256,address,uint16)",
          params: { asset, amount, onBehalfOf: recipient, referralCode: 0 },
          value: "0",
          gas: 300_000,
          unsigned: {
            contractId: contracts.lendingPool,
            functionName: "deposit",
            functionParams: [asset, amount, recipient, 0],
            payableAmount: "0"
          }
        };
      }
    } catch (error) {
      throw new Error(`Failed to ${this.executeMode ? 'deposit' : 'prepare deposit of'} ${asset}: ${error}`);
    }
  }

  async withdraw(asset: string, amount: string, to?: string): Promise<TransactionResult> {
    this.requireContractMode();
    
    try {
      const contracts = this.getContracts();
      const lendingPoolId = ContractId.fromEvmAddress(0, 0, contracts.lendingPool);
      const recipient = to || this.accountId!;
      
      const transaction = new ContractExecuteTransaction()
        .setContractId(lendingPoolId)
        .setGas(300_000)
        .setFunction("withdraw",
          new ContractFunctionParameters()
            .addAddress(asset)
            .addUint256(Long.fromString(amount))
            .addAddress(recipient)
        );
      
      if (this.executeMode) {
        const response = await transaction.execute(this.client!);
        const receipt = await response.getReceipt(this.client!);
        
        if (receipt.status !== Status.Success) {
          throw new Error(`Withdraw transaction failed: ${receipt.status}`);
        }
        
        return {
          type: "executed",
          transactionId: response.transactionId.toString(),
          status: "success"
        };
      } else {
        return {
          type: "prepared",
          description: `Withdraw ${amount} of ${asset} from Bonzo Finance`,
          from: this.accountId!,
          to: contracts.lendingPool,
          function: "withdraw(address,uint256,address)",
          params: { asset, amount, to: recipient },
          value: "0",
          gas: 300_000,
          unsigned: {
            contractId: contracts.lendingPool,
            functionName: "withdraw",
            functionParams: [asset, amount, recipient],
            payableAmount: "0"
          }
        };
      }
    } catch (error) {
      throw new Error(`Failed to ${this.executeMode ? 'withdraw' : 'prepare withdrawal of'} ${asset}: ${error}`);
    }
  }

  async borrow(
    asset: string, 
    amount: string, 
    interestRateMode: number = 2, 
    onBehalfOf?: string
  ): Promise<TransactionResult> {
    this.requireContractMode();
    
    try {
      const contracts = this.getContracts();
      const lendingPoolId = ContractId.fromEvmAddress(0, 0, contracts.lendingPool);
      const borrower = onBehalfOf || this.accountId!;
      
      const transaction = new ContractExecuteTransaction()
        .setContractId(lendingPoolId)
        .setGas(300_000)
        .setFunction("borrow",
          new ContractFunctionParameters()
            .addAddress(asset)
            .addUint256(Long.fromString(amount))
            .addUint256(interestRateMode) // 1 = stable, 2 = variable
            .addUint256(0) // referralCode
            .addAddress(borrower)
        );
      
      if (this.executeMode) {
        const response = await transaction.execute(this.client!);
        const receipt = await response.getReceipt(this.client!);
        
        if (receipt.status !== Status.Success) {
          throw new Error(`Borrow transaction failed: ${receipt.status}`);
        }
        
        return {
          type: "executed",
          transactionId: response.transactionId.toString(),
          status: "success"
        };
      } else {
        const rateMode = interestRateMode === 1 ? "stable" : "variable";
        return {
          type: "prepared",
          description: `Borrow ${amount} of ${asset} at ${rateMode} rate from Bonzo Finance`,
          from: this.accountId!,
          to: contracts.lendingPool,
          function: "borrow(address,uint256,uint256,uint16,address)",
          params: { asset, amount, interestRateMode, referralCode: 0, onBehalfOf: borrower },
          value: "0",
          gas: 300_000,
          unsigned: {
            contractId: contracts.lendingPool,
            functionName: "borrow",
            functionParams: [asset, amount, interestRateMode, 0, borrower],
            payableAmount: "0"
          }
        };
      }
    } catch (error) {
      throw new Error(`Failed to ${this.executeMode ? 'borrow' : 'prepare borrow of'} ${asset}: ${error}`);
    }
  }

  async repay(
    asset: string, 
    amount: string, 
    rateMode: number = 2, 
    onBehalfOf?: string
  ): Promise<TransactionResult> {
    this.requireContractMode();
    
    try {
      const contracts = this.getContracts();
      const lendingPoolId = ContractId.fromEvmAddress(0, 0, contracts.lendingPool);
      const borrower = onBehalfOf || this.accountId!;
      
      const transaction = new ContractExecuteTransaction()
        .setContractId(lendingPoolId)
        .setGas(300_000)
        .setFunction("repay",
          new ContractFunctionParameters()
            .addAddress(asset)
            .addUint256(Long.fromString(amount))
            .addUint256(rateMode) // 1 = stable, 2 = variable
            .addAddress(borrower)
        );
      
      if (this.executeMode) {
        const response = await transaction.execute(this.client!);
        const receipt = await response.getReceipt(this.client!);
        
        if (receipt.status !== Status.Success) {
          throw new Error(`Repay transaction failed: ${receipt.status}`);
        }
        
        return {
          type: "executed",
          transactionId: response.transactionId.toString(),
          status: "success"
        };
      } else {
        const rateModeStr = rateMode === 1 ? "stable" : "variable";
        return {
          type: "prepared",
          description: `Repay ${amount} of ${asset} (${rateModeStr} debt) to Bonzo Finance`,
          from: this.accountId!,
          to: contracts.lendingPool,
          function: "repay(address,uint256,uint256,address)",
          params: { asset, amount, rateMode, onBehalfOf: borrower },
          value: "0",
          gas: 300_000,
          unsigned: {
            contractId: contracts.lendingPool,
            functionName: "repay",
            functionParams: [asset, amount, rateMode, borrower],
            payableAmount: "0"
          }
        };
      }
    } catch (error) {
      throw new Error(`Failed to ${this.executeMode ? 'repay' : 'prepare repay of'} ${asset}: ${error}`);
    }
  }

  async setUserUseReserveAsCollateral(asset: string, useAsCollateral: boolean): Promise<TransactionResult> {
    this.requireContractMode();
    
    try {
      const contracts = this.getContracts();
      const lendingPoolId = ContractId.fromEvmAddress(0, 0, contracts.lendingPool);
      
      const transaction = new ContractExecuteTransaction()
        .setContractId(lendingPoolId)
        .setGas(200_000)
        .setFunction("setUserUseReserveAsCollateral",
          new ContractFunctionParameters()
            .addAddress(asset)
            .addBool(useAsCollateral)
        );
      
      if (this.executeMode) {
        const response = await transaction.execute(this.client!);
        const receipt = await response.getReceipt(this.client!);
        
        if (receipt.status !== Status.Success) {
          throw new Error(`Collateral setting transaction failed: ${receipt.status}`);
        }
        
        return {
          type: "executed",
          transactionId: response.transactionId.toString(),
          status: "success"
        };
      } else {
        const action = useAsCollateral ? "enable" : "disable";
        return {
          type: "prepared",
          description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${asset} as collateral`,
          from: this.accountId!,
          to: contracts.lendingPool,
          function: "setUserUseReserveAsCollateral(address,bool)",
          params: { asset, useAsCollateral },
          value: "0",
          gas: 200_000,
          unsigned: {
            contractId: contracts.lendingPool,
            functionName: "setUserUseReserveAsCollateral",
            functionParams: [asset, useAsCollateral],
            payableAmount: "0"
          }
        };
      }
    } catch (error) {
      const action = useAsCollateral ? 'enable' : 'disable';
      throw new Error(`Failed to ${this.executeMode ? action : 'prepare to ' + action} ${asset} as collateral: ${error}`);
    }
  }

  async getUserAccountData(userAddress?: string): Promise<UserAccountData> {
    this.requireContractMode();
    
    try {
      const contracts = this.getContracts();
      const lendingPoolId = ContractId.fromEvmAddress(0, 0, contracts.lendingPool);
      const user = userAddress || this.accountId!;
      
      const query = new ContractCallQuery()
        .setContractId(lendingPoolId)
        .setGas(100_000)
        .setFunction("getUserAccountData",
          new ContractFunctionParameters().addAddress(user)
        );
      
      const result = await query.execute(this.client!);
      
      return {
        totalCollateralETH: result.getUint256(0).toString(),
        totalDebtETH: result.getUint256(1).toString(),
        availableBorrowsETH: result.getUint256(2).toString(),
        currentLiquidationThreshold: result.getUint256(3).toString(),
        ltv: result.getUint256(4).toString(),
        healthFactor: result.getUint256(5).toString(),
      };
    } catch (error) {
      throw new Error(`Failed to get user account data: ${error}`);
    }
  }

  async getAssetPrice(asset: string): Promise<string> {
    this.requireContractMode();
    
    try {
      const contracts = this.getContracts();
      const oracleId = ContractId.fromEvmAddress(0, 0, contracts.priceOracle);
      
      const query = new ContractCallQuery()
        .setContractId(oracleId)
        .setGas(100_000)
        .setFunction("getAssetPrice",
          new ContractFunctionParameters().addAddress(asset)
        );
      
      const result = await query.execute(this.client!);
      return result.getUint256(0).toString();
    } catch (error) {
      throw new Error(`Failed to get asset price for ${asset}: ${error}`);
    }
  }

  async getReserveData(asset: string): Promise<ReserveData> {
    this.requireContractMode();
    
    try {
      const contracts = this.getContracts();
      const lendingPoolId = ContractId.fromEvmAddress(0, 0, contracts.lendingPool);
      
      const query = new ContractCallQuery()
        .setContractId(lendingPoolId)
        .setGas(150_000)
        .setFunction("getReserveData",
          new ContractFunctionParameters().addAddress(asset)
        );
      
      const result = await query.execute(this.client!);
      
      return {
        configuration: result.getUint256(0).toString(),
        liquidityIndex: result.getUint256(1).toString(),
        variableBorrowIndex: result.getUint256(2).toString(),
        currentLiquidityRate: result.getUint256(3).toString(),
        currentVariableBorrowRate: result.getUint256(4).toString(),
        currentStableBorrowRate: result.getUint256(5).toString(),
        aTokenAddress: "0x" + result.getAddress(7),
        stableDebtTokenAddress: "0x" + result.getAddress(8),
        variableDebtTokenAddress: "0x" + result.getAddress(9),
        interestRateStrategyAddress: "0x" + result.getAddress(10),
      };
    } catch (error) {
      throw new Error(`Failed to get reserve data for ${asset}: ${error}`);
    }
  }

  async getATokenBalance(aTokenAddress: string, userAddress?: string): Promise<string> {
    this.requireContractMode();
    
    try {
      const aTokenId = ContractId.fromEvmAddress(0, 0, aTokenAddress);
      const user = userAddress || this.accountId!;
      
      const query = new ContractCallQuery()
        .setContractId(aTokenId)
        .setGas(100_000)
        .setFunction("balanceOf",
          new ContractFunctionParameters().addAddress(user)
        );
      
      const result = await query.execute(this.client!);
      return result.getUint256(0).toString();
    } catch (error) {
      throw new Error(`Failed to get aToken balance: ${error}`);
    }
  }
}