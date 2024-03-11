import { Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CommandBus } from '@nestjs/cqrs';

@Controller('integrations/telegram')
export class TelegramController {
  constructor(protected commandBus: CommandBus) {}
  @UseGuards(JwtAuthGuard)
  @Get('auth-bot-link')
  @HttpCode(200)
  async getAuthBotLink() {}
  @Post('webhook')
  @HttpCode(204)
  async setWebhook() {}
}
