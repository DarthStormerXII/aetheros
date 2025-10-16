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

const STADER_CONTRACT_ABI = [
  "function getExchangeRate() view returns (uint256)",
  "function getTotalPooledHbar() view returns (uint256)",
  "function getHbarxSupply() view returns (uint256)",
  "function stake() payable returns (uint256)",
  "function unstake(uint256 hbarxAmount) returns (uint256)",
];

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
    functionParams: string;
    payableAmount?: string;
  };
}

export interface ExecutedTransaction {
  type: "executed";
  transactionId: string;
  status: string;
}

export type TransactionResult = PreparedTransaction | ExecutedTransaction;

export class StaderClient {
  private client: Client;
  private contractId: ContractId;
  private contractInterface: ethers.Interface;
  private executeMode: boolean;
  private accountId: string;
  
  constructor(client: Client, contractAddress: string, executeMode: boolean, accountId: string) {
    this.client = client;
    this.contractId = ContractId.fromString(contractAddress);
    this.contractInterface = new ethers.Interface(STADER_CONTRACT_ABI);
    this.executeMode = executeMode;
    this.accountId = accountId;
  }

  async getExchangeRate(): Promise<{ rate: string; totalHbar: string; hbarxSupply: string }> {
    try {
      const functionData = this.contractInterface.encodeFunctionData("getExchangeRate");
      
      const query = new ContractCallQuery()
        .setContractId(this.contractId)
        .setGas(100_000)
        .setFunction("getExchangeRate");
      
      const result = await query.execute(this.client);
      const rate = result.getUint256(0);
      
      const totalHbarQuery = new ContractCallQuery()
        .setContractId(this.contractId)
        .setGas(100_000)
        .setFunction("getTotalPooledHbar");
      
      const totalHbarResult = await totalHbarQuery.execute(this.client);
      const totalHbar = totalHbarResult.getUint256(0);
      
      const supplyQuery = new ContractCallQuery()
        .setContractId(this.contractId)
        .setGas(100_000)
        .setFunction("getHbarxSupply");
      
      const supplyResult = await supplyQuery.execute(this.client);
      const hbarxSupply = supplyResult.getUint256(0);
      
      return {
        rate: rate.toString(),
        totalHbar: totalHbar.toString(),
        hbarxSupply: hbarxSupply.toString(),
      };
    } catch (error) {
      throw new Error(`Failed to get exchange rate: ${error}`);
    }
  }

  async stake(amount: Hbar): Promise<TransactionResult> {
    try {
      // Build the stake transaction
      const transaction = new ContractExecuteTransaction()
        .setContractId(this.contractId)
        .setGas(200_000)
        .setPayableAmount(amount)
        .setFunction("stake");
      
      if (this.executeMode) {
        // Execute mode - sign and submit transaction
        const response = await transaction.execute(this.client);
        const receipt = await response.getReceipt(this.client);
        
        if (receipt.status !== Status.Success) {
          throw new Error(`Stake transaction failed: ${receipt.status}`);
        }
        
        return {
          type: "executed",
          transactionId: response.transactionId.toString(),
          status: "success"
        };
      } else {
        // Prepare mode - return unsigned transaction data
        return {
          type: "prepared",
          description: `Stake ${amount.toString()} to receive HBARX`,
          from: this.accountId,
          to: this.contractId.toString(),
          function: "stake()",
          params: {},
          value: amount.toTinybars().toString(),
          gas: 200_000,
          unsigned: {
            contractId: this.contractId.toString(),
            functionName: "stake",
            functionParams: "",
            payableAmount: amount.toTinybars().toString()
          }
        };
      }
    } catch (error) {
      throw new Error(`Failed to ${this.executeMode ? 'stake' : 'prepare stake of'} HBAR: ${error}`);
    }
  }

  async unstake(hbarxAmount: string): Promise<TransactionResult> {
    try {
      // Build the unstake transaction
      const functionData = this.contractInterface.encodeFunctionData("unstake", [hbarxAmount]);
      
      const transaction = new ContractExecuteTransaction()
        .setContractId(this.contractId)
        .setGas(200_000)
        .setFunction("unstake", 
          new ContractFunctionParameters()
            .addUint256(Long.fromString(hbarxAmount))
        );
      
      if (this.executeMode) {
        // Execute mode - sign and submit transaction
        const response = await transaction.execute(this.client);
        const receipt = await response.getReceipt(this.client);
        
        if (receipt.status !== Status.Success) {
          throw new Error(`Unstake transaction failed: ${receipt.status}`);
        }
        
        return {
          type: "executed",
          transactionId: response.transactionId.toString(),
          status: "success"
        };
      } else {
        // Prepare mode - return unsigned transaction data
        return {
          type: "prepared",
          description: `Unstake ${hbarxAmount} HBARX to receive HBAR`,
          from: this.accountId,
          to: this.contractId.toString(),
          function: "unstake(uint256)",
          params: { hbarxAmount },
          value: "0",
          gas: 200_000,
          unsigned: {
            contractId: this.contractId.toString(),
            functionName: "unstake",
            functionParams: hbarxAmount,
            payableAmount: "0"
          }
        };
      }
    } catch (error) {
      throw new Error(`Failed to ${this.executeMode ? 'unstake' : 'prepare unstake of'} HBARX: ${error}`);
    }
  }
}