import axios, { AxiosInstance } from "axios";

export interface SupportedAsset {
  id: string;
  symbol: string;
  name: string;
  networkId: string;
  contractAddress?: string;
  decimals: number;
  isNative: boolean;
}

export interface BridgeQuote {
  sourceAsset: string;
  targetAsset: string;
  sourceAmount: string;
  targetAmount: string;
  fee: string;
  estimatedTime: number;
  steps: Array<{
    type: string;
    description: string;
  }>;
}

export interface Network {
  id: string;
  name: string;
  type: string;
  chainId?: number;
}

export class HashportClient {
  private api: AxiosInstance;
  
  constructor() {
    this.api = axios.create({
      baseURL: "https://api.hashport.network/api/v1",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async getSupportedNetworks(): Promise<Network[]> {
    const response = await this.api.get("/networks");
    return response.data;
  }

  async getSupportedAssets(sourceNetwork?: string, targetNetwork?: string): Promise<SupportedAsset[]> {
    const params: any = {};
    if (sourceNetwork) params.sourceNetwork = sourceNetwork;
    if (targetNetwork) params.targetNetwork = targetNetwork;
    
    const response = await this.api.get("/assets", { params });
    return response.data;
  }

  async getBridgeQuote(params: {
    sourceNetworkId: string;
    targetNetworkId: string;
    sourceAssetId: string;
    amount: string;
    recipient: string;
  }): Promise<BridgeQuote> {
    const response = await this.api.post("/bridge/quote", params);
    return response.data;
  }

  async initiateBridge(params: {
    sourceNetworkId: string;
    targetNetworkId: string;
    sourceAssetId: string;
    amount: string;
    recipient: string;
    sourceTransactionId?: string;
  }) {
    const response = await this.api.post("/bridge", params);
    return response.data;
  }

  async getBridgeStatus(bridgeId: string) {
    const response = await this.api.get(`/bridge/${bridgeId}/status`);
    return response.data;
  }
}