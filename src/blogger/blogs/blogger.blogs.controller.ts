import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Req,
  // Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { InputBlogCreateDto } from './dto/input.create-blog.dto';
import { CommandBus } from '@nestjs/cqrs';
import { CreateBlogCommand } from './use-cases/create.blog.use-case';
import { InputUpdateBlogDto } from './dto/input.update-blog.dto';
import { UpdateBlogCommand } from './use-cases/update.blog.use-case';
import { DeleteBlogCommand } from './use-cases/delete.blog.use-case';
import {
  parseQueryPagination,
  QueryParserType,
} from '../../base/application-helpers/query-parser-type';
import { BloggerBlogsQuery } from './blogger.blogs.query';
import { InputCreatePostForBlogDto } from './dto/input.create-post-for-blog.dto';
import { CreatePostForBlogCommand } from './use-cases/create.post.for.blog.use-case';
import { InputUpdatePostDto } from './dto/input.update-post.dto';
import { UpdatePostForBlogCommand } from './use-cases/update.post.for.blog.use-case';
import { DeletePostCommand } from './use-cases/delete.post.use-case';
import { OutputBlogImageDto } from '../../blogs/dto/output.blog-image.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { OutputPostImageDto } from '../../blogs/dto/output.post-image.dto';
import { PaginatorType } from '../../base/application-helpers/paginator.type';
import { PostViewModelType } from '../../posts/types/posts.types';
import { UploadBlogImageCommand } from './use-cases/upload.blog.image.use-case';
import { ImageTypes } from '../../base/application-helpers/image.types';
import { UploadPostImageCommand } from './use-cases/upload.post.image.use-case';
// import { Response } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('blogger/blogs')
export class BloggerBlogsController {
  constructor(
    protected readonly bloggerBlogsQueryRepo: BloggerBlogsQuery,
    protected commandBus: CommandBus,
  ) {}
  @Get()
  @HttpCode(200)
  async getAllBlogsForBlogger(@Query() query: QueryParserType, @Req() req) {
    const queryParams = parseQueryPagination(query);
    return await this.bloggerBlogsQueryRepo.getAllBlogsForBlogger(
      queryParams,
      req.user.userId,
    );
  }
  @Post()
  @HttpCode(201)
  async createBlog(@Body() blogCreateDto: InputBlogCreateDto, @Req() req) {
    return await this.commandBus.execute(
      new CreateBlogCommand(blogCreateDto, req.user.userId),
    );
  }
  @Put(':id')
  @HttpCode(204)
  async updateBlog(
    @Body() blogDataDto: InputUpdateBlogDto,
    @Param('id') blogId: string,
    @Req() req,
  ) {
    await this.commandBus.execute(
      new UpdateBlogCommand(blogDataDto, blogId, req.user.userId),
    );
    return;
  }
  @Delete(':id')
  @HttpCode(204)
  async deleteBlog(@Param('id') blogId: string, @Req() req) {
    await this.commandBus.execute(
      new DeleteBlogCommand(blogId, req.user.userId),
    );
    return;
  }
  @Get(':blogId/posts')
  @HttpCode(200)
  async getAllPostsForBlog(
    @Param('blogId') blogId: string,
    @Query() query: QueryParserType,
    @Req() req,
  ): Promise<PaginatorType<PostViewModelType>> {
    const queryParams = parseQueryPagination(query);
    return await this.bloggerBlogsQueryRepo.getAllPostsForBlog(
      blogId,
      queryParams,
      req.user.userId,
    );
  }
  @Post(':blogId/posts')
  @HttpCode(201)
  async createPostForBlog(
    @Param('blogId') blogId: string,
    @Body() createPostDto: InputCreatePostForBlogDto,
    @Req() req,
  ) {
    return await this.commandBus.execute(
      new CreatePostForBlogCommand(createPostDto, blogId, req.user.userId),
    );
  }
  @Put(':blogId/posts/:id')
  @HttpCode(204)
  async updatePost(
    @Param('blogId') blogId: string,
    @Param('id') postId: string,
    @Body() updatePostDto: InputUpdatePostDto,
    @Req() req,
  ) {
    await this.commandBus.execute(
      new UpdatePostForBlogCommand(
        updatePostDto,
        blogId,
        postId,
        req.user.userId,
      ),
    );
    return;
  }
  @Delete(':blogId/posts/:id')
  @HttpCode(204)
  async deletePost(
    @Param('blogId') blogId: string,
    @Param('id') postId: string,
    @Req() req,
  ) {
    await this.commandBus.execute(
      new DeletePostCommand(blogId, postId, req.user.userId),
    );
    return;
  }
  @Get('comments')
  @HttpCode(200)
  async getAllCommentsForBloggerPosts(
    @Req() req,
    @Query() query: QueryParserType,
  ) {
    const queryParams = parseQueryPagination(query);
    return await this.bloggerBlogsQueryRepo.getAllCommentsForBloggerPosts(
      queryParams,
      req.user.userId,
    );
  }
  @Post(':blogId/images/wallpaper')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(201)
  async uploadBlogWallpaper(
    @UploadedFile() file,
    @Param('blogId') blogId: string,
    @Req() req,
  ): Promise<OutputBlogImageDto> {
    const filename = file.originalname;
    return this.commandBus.execute(
      new UploadBlogImageCommand(
        file.buffer,
        file.size,
        blogId,
        filename,
        req.user.userId,
        ImageTypes.wallpaper,
      ),
    );
  }
  @Post(':blogId/images/main')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(201)
  async uploadBlogMainImage(
    @UploadedFile() file: Express.Multer.File,
    @Param('blogId') blogId: string,
    @Req() req,
    // @Res({ passthrough: true }) res: Response,
  ) {
    const filename = file.originalname;
    const result = await this.commandBus.execute(
      new UploadBlogImageCommand(
        file.buffer,
        file.size,
        blogId,
        filename,
        req.user.userId,
        ImageTypes.main,
      ),
    );
    console.log(result);
    return result;
    // res.send(result);
  }
  @Post(':blogId/posts/:postId/images/main')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(201)
  async uploadPostMainImage(
    @UploadedFile() file,
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @Req() req,
  ): Promise<OutputPostImageDto> {
    const filename = file.originalname;
    return this.commandBus.execute(
      new UploadPostImageCommand(
        file.buffer,
        file.size,
        blogId,
        postId,
        filename,
        req.user.userId,
      ),
    );
  }
}
