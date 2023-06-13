import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CommandBus } from '@nestjs/cqrs';
import { InputBanUserForBlogDto } from './dto/input.ban-user-for-blog.dto';
import { BanUserForBlogCommand } from './use-cases/ban.user.for.blog.use-case';
import { BloggerUsersQuery } from './blogger.users.query';
import {
  parseUserQueryPagination,
  UserQueryParserType,
} from '../../application-helpers/query-parser-type';

@UseGuards(JwtAuthGuard)
@Controller('blogger/users')
export class BloggerUsersController {
  constructor(
    protected readonly bloggerUsersQueryRepo: BloggerUsersQuery,
    protected commandBus: CommandBus,
  ) {}
  @Put(':id/ban')
  @HttpCode(204)
  async banUser(
    @Param('id') userId: string,
    @Body() banUserForBlogDto: InputBanUserForBlogDto,
    @Req() req,
  ) {
    await this.commandBus.execute(
      new BanUserForBlogCommand(banUserForBlogDto, userId, req.user.userId),
    );
    return;
  }
  @Get('blog/:id')
  @HttpCode(200)
  async getAllBannedUsersForBlog(
    @Param('id') blogId: string,
    @Query() query: UserQueryParserType,
    @Req() req,
  ) {
    const queryParams: UserQueryParserType = parseUserQueryPagination(query);
    return this.bloggerUsersQueryRepo.getAllBannedUsersForBlog(
      blogId,
      req.user.userId,
      queryParams,
    );
  }
}
