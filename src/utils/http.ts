/**
 * HTTP 请求工具
 */

export interface HttpRequestOptions {
  method?: 'GET' | 'HEAD' | 'POST' | 'OPTIONS';
  headers?: Record<string, string>;
  timeout?: number;
  followRedirects?: boolean;
  maxRedirects?: number;
}

export interface HttpResponse {
  url: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body?: string;
  redirected: boolean;
  finalURL?: string;
  timing: {
    start: number;
    end: number;
    duration: number;
  };
}

/**
 * 发起 HTTP 请求
 */
export async function httpRequest(
  url: string,
  options: HttpRequestOptions = {}
): Promise<HttpResponse> {
  const {
    method = 'GET',
    headers = {},
    timeout = 5000,
    followRedirects = true,
    maxRedirects = 5,
  } = options;

  const startTime = performance.now();

  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const fetchOptions: RequestInit = {
      method,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...headers,
      },
      signal: controller.signal,
      redirect: followRedirects ? 'follow' : 'manual',
      // @ts-ignore - maxRedirects is not in TypeScript types but works in browsers
      maxRedirects,
    };

    fetch(url, fetchOptions)
      .then(async (response) => {
        clearTimeout(timeoutId);

        const endTime = performance.now();
        const responseHeaders: Record<string, string> = {};

        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        let body: string | undefined;
        if (method === 'GET' || method === 'POST') {
          try {
            // 限制响应大小为 1MB
            const contentLength = parseInt(responseHeaders['content-length'] || '0');
            if (contentLength > 0 && contentLength < 1024 * 1024) {
              body = await response.text();
            } else {
              // 流式读取前 1MB
              const reader = response.body?.getReader();
              const decoder = new TextDecoder();
              let accumulated = '';
              let totalLength = 0;

              if (reader) {
                while (totalLength < 1024 * 1024) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  totalLength += value.length;
                  accumulated += decoder.decode(value, { stream: true });
                }
                reader.cancel();
              }

              body = accumulated;
            }
          } catch (error) {
            console.warn('Failed to read response body:', error);
          }
        }

        resolve({
          url,
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          body,
          redirected: response.redirected,
          finalURL: response.url !== url ? response.url : undefined,
          timing: {
            start: startTime,
            end: endTime,
            duration: endTime - startTime,
          },
        });
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          reject(new Error(`Request timeout after ${timeout}ms`));
        } else {
          reject(error);
        }
      });
  });
}

/**
 * HEAD 请求
 */
export async function httpHead(url: string, options?: HttpRequestOptions): Promise<HttpResponse> {
  return httpRequest(url, { ...options, method: 'HEAD' });
}

/**
 * GET 请求
 */
export async function httpGet(url: string, options?: HttpRequestOptions): Promise<HttpResponse> {
  return httpRequest(url, { ...options, method: 'GET' });
}

/**
 * 批量请求(带并发控制)
 */
export async function httpBatchRequest(
  urls: string[],
  options: HttpRequestOptions & { concurrency?: number } = {}
): Promise<HttpResponse[]> {
  const { concurrency = 5, ...requestOptions } = options;
  const results: HttpResponse[] = [];
  const queue = [...urls];

  const executeRequest = async (): Promise<void> => {
    while (queue.length > 0) {
      const url = queue.shift();
      if (!url) break;

      try {
        const response = await httpRequest(url, requestOptions);
        results.push(response);
      } catch (error) {
        console.error(`Request failed for ${url}:`, error);
        // 仍然添加错误结果
        results.push({
          url,
          status: 0,
          statusText: 'Error',
          headers: {},
          redirected: false,
          timing: {
            start: 0,
            end: 0,
            duration: 0,
          },
        });
      }
    }
  };

  // 创建并发请求
  const workers = Array.from({ length: Math.min(concurrency, urls.length) }, () =>
    executeRequest()
  );

  await Promise.all(workers);

  return results;
}

/**
 * 重试请求
 */
export async function httpRequestWithRetry(
  url: string,
  options: HttpRequestOptions & { retryCount?: number; retryDelay?: number } = {}
): Promise<HttpResponse> {
  const { retryCount = 2, retryDelay = 1000, ...requestOptions } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      return await httpRequest(url, requestOptions);
    } catch (error) {
      lastError = error as Error;
      if (attempt < retryCount) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
}
