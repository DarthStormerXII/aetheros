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
      baseURL: "https://mainnet.api.hashport.network",
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 15000, // 15 second timeout
    });
  }

  async getSupportedNetworks(): Promise<Network[]> {
    const response = await this.api.get("/api/v1/networks");
    return response.data;
  }

  async getSupportedAssets(sourceNetwork?: string, targetNetwork?: string): Promise<any[]> {
    const params: any = {};
    if (sourceNetwork) params.sourceNetwork = sourceNetwork;
    if (targetNetwork) params.targetNetwork = targetNetwork;
    
    const response = await this.api.get("/api/v1/assets", { params });
    return response.data;
  }

  async getBridgeSteps(params: {
    sourceNetworkId: string;
    targetNetworkId: string;
    sourceAssetId: string;
    recipient: string;
    amount?: string;
    tokenId?: string;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('sourceNetworkId', params.sourceNetworkId);
    queryParams.append('sourceAssetId', params.sourceAssetId);
    queryParams.append('targetNetworkId', params.targetNetworkId);
    queryParams.append('recipient', params.recipient);
    if (params.amount) queryParams.append('amount', params.amount);
    if (params.tokenId) queryParams.append('tokenId', params.tokenId);
    
    const response = await this.api.get(`/api/v1/bridge?${queryParams.toString()}`);
    return response.data;
  }

  async validateBridge(params: {
    sourceNetworkId: string;
    targetNetworkId: string;
    sourceAssetId: string;
    recipient: string;
    amount?: string;
    tokenId?: string;
  }): Promise<{ message: string; valid: boolean }> {
    const queryParams = new URLSearchParams();
    queryParams.append('sourceNetworkId', params.sourceNetworkId);
    queryParams.append('sourceAssetId', params.sourceAssetId);
    queryParams.append('targetNetworkId', params.targetNetworkId);
    queryParams.append('recipient', params.recipient);
    if (params.amount) queryParams.append('amount', params.amount);
    if (params.tokenId) queryParams.append('tokenId', params.tokenId);
    
    const response = await this.api.get(`/api/v1/bridge-validate?${queryParams.toString()}`);
    return response.data;
  }

  async getAssetsAmounts(): Promise<any> {
    const response = await this.api.get("/api/v1/assets-amounts");
    return response.data;
  }

  async getTransfers(params: {
    page: number;
    pageSize: number;
    filter?: {
      originator?: string;
      timestamp?: string;
      tokenId?: string;
      transactionId?: string;
    };
  }): Promise<{ items: any[]; totalCount: number }> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', params.page.toString());
    queryParams.append('pageSize', Math.min(params.pageSize, 50).toString());
    
    if (params.filter) {
      if (params.filter.originator) queryParams.append('filter.originator', params.filter.originator);
      if (params.filter.timestamp) queryParams.append('filter.timestamp', params.filter.timestamp);
      if (params.filter.tokenId) queryParams.append('filter.tokenId', params.filter.tokenId);
      if (params.filter.transactionId) queryParams.append('filter.transactionId', params.filter.transactionId);
    }
    
    const response = await this.api.get(`/api/v1/transfers?${queryParams.toString()}`);
    return response.data;
  }

  async getNetworkAssets(networkId: string): Promise<any> {
    const response = await this.api.get(`/api/v1/networks/${networkId}/assets`);
    return response.data;
  }

  async getNetworkAssetAmounts(networkId: string, assetId: string): Promise<any> {
    const response = await this.api.get(`/api/v1/networks/${networkId}/assets/${assetId}/amounts`);
    return response.data;
  }

  async getNetworkAssetDetails(networkId: string, assetId: string): Promise<any> {
    const response = await this.api.get(`/api/v1/networks/${networkId}/assets/${assetId}`);
    return response.data;
  }

  async convertHederaTxId(txId: string): Promise<any> {
    const queryParams = new URLSearchParams();
    queryParams.append('txId', txId);
    const response = await this.api.get(`/api/v1/utils/convert-hedera-tx-id?${queryParams.toString()}`);
    return response.data;
  }
}