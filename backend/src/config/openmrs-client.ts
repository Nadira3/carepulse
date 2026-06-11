import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from './env';

export class OpenMRSClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.OPENMRS.BASE_URL,
      auth: {
        username: config.OPENMRS.USERNAME,
        password: config.OPENMRS.PASSWORD,
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 10000,
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const status = error.response?.status;
        const message =
          (error.response?.data as any)?.error?.message ?? error.message;

        if (status === 401) {
          throw new Error(`OpenMRS authentication failed: ${message}`);
        }
        if (status === 404) {
          throw new Error(`OpenMRS resource not found: ${message}`);
        }
        if (status === 400) {
          throw new Error(`OpenMRS bad request: ${message}`);
        }
        throw new Error(`OpenMRS error (${status}): ${message}`);
      }
    );
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const response = await this.client.get<T>(path, { params });
    return response.data;
  }

  async post<T>(path: string, data: unknown): Promise<T> {
    const response = await this.client.post<T>(path, data);
    return response.data;
  }

  async delete<T>(path: string): Promise<T> {
    const response = await this.client.delete<T>(path);
    return response.data;
  }
}

export const openmrsClient = new OpenMRSClient();
