import { injectable } from 'inversify';
import { ApiConfig } from './ApiConfig';

/**
 * HTTP 請求方法
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE'
}

/**
 * API 響應格式
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

/**
 * BaseApiAdapter - 基礎 API 適配器
 * 處理 HTTP 請求並自動附加身份驗證令牌
 */
@injectable()
export class BaseApiAdapter {
  protected readonly API_BASE_URL: string = ApiConfig.baseUrl;
  protected readonly TOKEN_KEY: string = 'auth_token';
  
  /**
   * 從 localStorage 獲取令牌
   */
  protected getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('[BaseApiAdapter] 獲取令牌失敗:', error);
      return null;
    }
  }
  
  /**
   * 創建請求選項，自動附加授權標頭
   */
  protected createRequestOptions(method: HttpMethod, body?: any): RequestInit {
    const token = this.getToken();
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    // 添加授權標頭
    if (token) {
      (options.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
    
    // 添加請求體
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    return options;
  }
  
  /**
   * 執行 HTTP 請求
   */
  protected async request<T>(path: string, method: HttpMethod, body?: any): Promise<ApiResponse<T>> {
    try {
      const url = `${this.API_BASE_URL}${path}`;
      const options = this.createRequestOptions(method, body);
      
      console.log(`[BaseApiAdapter] 發送請求: ${method} ${url}`);
      
      const response = await fetch(url, options);
      const responseText = await response.text();
      
      // 嘗試解析 JSON 響應
      let data: any;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (error) {
        console.warn(`[BaseApiAdapter] 響應不是有效的 JSON: ${responseText}`);
        data = { message: responseText };
      }
      
      if (!response.ok) {
        console.error(`[BaseApiAdapter] 請求失敗: ${response.status} ${response.statusText}`);
        return {
          error: data.error || data.message || response.statusText,
          message: `Request failed with status: ${response.status}`
        };
      }
      
      return { data, message: data.message };
    } catch (error) {
      console.error('[BaseApiAdapter] 請求錯誤:', error);
      return {
        error: error instanceof Error ? error.message : '未知錯誤',
        message: '請求失敗'
      };
    }
  }
  
  /**
   * GET 請求
   */
  protected async get<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(path, HttpMethod.GET);
  }
  
  /**
   * POST 請求
   */
  protected async post<T>(path: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(path, HttpMethod.POST, body);
  }
  
  /**
   * PUT 請求
   */
  protected async put<T>(path: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(path, HttpMethod.PUT, body);
  }
  
  /**
   * PATCH 請求
   */
  protected async patch<T>(path: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(path, HttpMethod.PATCH, body);
  }
  
  /**
   * DELETE 請求
   */
  protected async delete<T>(path: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(path, HttpMethod.DELETE, body);
  }
} 
