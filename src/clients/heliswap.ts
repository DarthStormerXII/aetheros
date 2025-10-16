import { 
  Client, 
  ContractCallQuery,
  ContractId,
  ContractFunctionParameters,
  Long
} from "@hashgraph/sdk";
import { ethers } from "ethers";

const HELISWAP_FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) view returns (address pair)",
  "function allPairs(uint256) view returns (address)",
  "function allPairsLength() view returns (uint256)",
];

const HELISWAP_PAIR_ABI = [
  "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function totalSupply() view returns (uint256)",
  "function kLast() view returns (uint256)",
];

const HELISWAP_ROUTER_ABI = [
  "function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) pure returns (uint256 amountOut)",
  "function getAmountsOut(uint256 amountIn, address[] memory path) view returns (uint256[] memory amounts)",
];

export interface PairInfo {
  pairAddress: string;
  token0: string;
  token1: string;
  reserve0: string;
  reserve1: string;
  totalSupply: string;
}

export class HeliSwapClient {
  private client: Client;
  private factoryAddress: string;
  private routerAddress: string;
  private factoryInterface: ethers.Interface;
  private pairInterface: ethers.Interface;
  private routerInterface: ethers.Interface;
  
  constructor(
    client: Client, 
    factoryAddress: string = "0x0000000000000000000000000000000000134224",
    routerAddress: string = "0x000000000000000000000000000000000013422e"
  ) {
    this.client = client;
    this.factoryAddress = factoryAddress;
    this.routerAddress = routerAddress;
    this.factoryInterface = new ethers.Interface(HELISWAP_FACTORY_ABI);
    this.pairInterface = new ethers.Interface(HELISWAP_PAIR_ABI);
    this.routerInterface = new ethers.Interface(HELISWAP_ROUTER_ABI);
  }

  async getPairAddress(token0: string, token1: string): Promise<string | null> {
    try {
      const factoryId = ContractId.fromEvmAddress(0, 0, this.factoryAddress);
      
      const query = new ContractCallQuery()
        .setContractId(factoryId)
        .setGas(100_000)
        .setFunction("getPair", 
          new ContractFunctionParameters()
            .addAddress(token0)
            .addAddress(token1)
        );
      
      const result = await query.execute(this.client);
      const pairAddress = "0x" + result.getAddress(0);
      
      if (pairAddress === "0x0000000000000000000000000000000000000000") {
        return null;
      }
      
      return pairAddress;
    } catch (error) {
      throw new Error(`Failed to get pair address: ${error}`);
    }
  }

  async getPairInfo(token0: string, token1: string): Promise<PairInfo | null> {
    const pairAddress = await this.getPairAddress(token0, token1);
    if (!pairAddress) {
      return null;
    }

    try {
      const pairId = ContractId.fromEvmAddress(0, 0, pairAddress);
      
      const reservesQuery = new ContractCallQuery()
        .setContractId(pairId)
        .setGas(100_000)
        .setFunction("getReserves");
      
      const reservesResult = await reservesQuery.execute(this.client);
      const reserve0 = reservesResult.getUint256(0);
      const reserve1 = reservesResult.getUint256(1);
      
      const supplyQuery = new ContractCallQuery()
        .setContractId(pairId)
        .setGas(100_000)
        .setFunction("totalSupply");
      
      const supplyResult = await supplyQuery.execute(this.client);
      const totalSupply = supplyResult.getUint256(0);
      
      return {
        pairAddress,
        token0,
        token1,
        reserve0: reserve0.toString(),
        reserve1: reserve1.toString(),
        totalSupply: totalSupply.toString(),
      };
    } catch (error) {
      throw new Error(`Failed to get pair info: ${error}`);
    }
  }

  async getAmountOut(
    amountIn: string, 
    reserveIn: string, 
    reserveOut: string
  ): Promise<string> {
    try {
      const routerId = ContractId.fromEvmAddress(0, 0, this.routerAddress);
      
      const query = new ContractCallQuery()
        .setContractId(routerId)
        .setGas(100_000)
        .setFunction("getAmountOut",
          new ContractFunctionParameters()
            .addUint256(Long.fromString(amountIn))
            .addUint256(Long.fromString(reserveIn))
            .addUint256(Long.fromString(reserveOut))
        );
      
      const result = await query.execute(this.client);
      const amountOut = result.getUint256(0);
      
      return amountOut.toString();
    } catch (error) {
      throw new Error(`Failed to calculate amount out: ${error}`);
    }
  }
}