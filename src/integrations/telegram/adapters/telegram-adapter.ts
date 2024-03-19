import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class TelegramAdapter {
  constructor(
    protected readonly configService: ConfigService,
    private axiosInstance: AxiosInstance,
  ) {
    const token = this.configService.get('TELEGRAM_TOKEN');
    this.axiosInstance = axios.create({
      baseURL: `https://api.telegram.org/bot${token}/`,
    });
  }
  async sendMessage(text: string, recipientId: number) {
    await this.axiosInstance.post(`sendMessage`, {
      chat_id: recipientId,
      text: text,
    });
  }
  async setWebhook(url: string) {
    await this.axiosInstance.post(`setWebhook`, {
      url: url,
    });
  }
}
