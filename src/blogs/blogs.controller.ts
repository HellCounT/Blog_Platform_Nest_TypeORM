import {
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  parseQueryPagination,
  QueryParserType,
} from '../base/application-helpers/query-parser-type';
import { BlogsQuery } from './blogs.query';
import { PostsQuery } from '../posts/posts.query';
import { GuestGuard } from '../auth/guards/guest.guard';
import { PaginatorType } from '../base/application-helpers/paginator.type';
import { BlogViewModelType } from './types/blogs.types';
import { PostViewModelType } from '../posts/types/posts.types';

@Controller('blogs')
export class BlogsController {
  constructor(
    protected readonly blogsQueryRepo: BlogsQuery,
    protected readonly postsQueryRepo: PostsQuery,
  ) {}
  @Get()
  @HttpCode(200)
  async getAllBlogs(
    @Query() query: QueryParserType,
  ): Promise<PaginatorType<BlogViewModelType>> {
    const queryParams = parseQueryPagination(query);
    return await this.blogsQueryRepo.viewAllBlogs(queryParams);
  }
  @Get(':id')
  @HttpCode(200)
  async getBlogById(@Param('id') id: string): Promise<BlogViewModelType> {
    const result = await this.blogsQueryRepo.findBlogById(id);
    if (!result) throw new NotFoundException();
    return result;
  }
  @UseGuards(GuestGuard)
  @Get(':id/posts')
  @HttpCode(200)
  async getPostsForBlogId(
    @Param('id') id: string,
    @Query() query: QueryParserType,
    @Req() req,
  ): Promise<PaginatorType<PostViewModelType> | null> {
    const queryParams = parseQueryPagination(query);
    return this.postsQueryRepo.findPostsByBlogId(
      id,
      queryParams,
      req.user.userId,
    );
  }
  @Get(`:blogId/images/wallpaper/:filename`)
  @HttpCode(200)
  async getBlogWallpaper(
    @Param('blogId') blogId: string,
    @Param('filename') filename: string,
  ): Promise<Buffer> {
    const key = `blogs/${blogId}/images/wallpaper/${filename}`;
    return this.blogsQueryRepo.getImageFile(key);
  }
  @Get(`:blogId/images/main/:filename`)
  @HttpCode(200)
  async getBlogMainImage(
    @Param('blogId') blogId: string,
    @Param('filename') filename: string,
  ): Promise<Buffer> {
    const key = `blogs/${blogId}/images/main/${filename}`;
    return this.blogsQueryRepo.getImageFile(key);
  }
  @Get(`:blogId/posts/:postId/images/:filename`)
  @HttpCode(200)
  async getPostMainImage(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @Param('filename') filename: string,
  ): Promise<Buffer> {
    const key = `blogs/${blogId}/posts/${postId}/images/${filename}`;
    return this.blogsQueryRepo.getImageFile(key);
  }
}
