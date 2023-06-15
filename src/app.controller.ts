import { Controller, Delete, Get, HttpCode } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Delete('testing/all-data')
  @HttpCode(204)
  async deleteAllData() {
    await Promise.allSettled([
      this.dataSource.query(`DELETE FROM "user"`),
      this.dataSource.query(`DELETE FROM "post"`),
      this.dataSource.query(`DELETE FROM "blog"`),
      this.dataSource.query(`DELETE FROM "comment"`),
      this.dataSource.query(`DELETE FROM "comment_like"`),
      this.dataSource.query(`DELETE FROM "post_like"`),
      this.dataSource.query(`DELETE FROM "user_banned_by_blogger"`),

      this.dataSource.query(`DELETE FROM "question"`),
      this.dataSource.query(`DELETE FROM "answer"`),
    ]);
    return;
  }
}
