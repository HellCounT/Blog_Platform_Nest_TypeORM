import { InputCreatePostForBlogDto } from '../dto/input.create-post-for-blog.dto';
import { CommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../../blogs/blogs.repository';
import { PostsRepository } from '../../../posts/posts.repository';
import { PostViewModelType } from '../../../posts/types/posts.types';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

export class CreatePostForBlogCommand {
  constructor(
    public createPostDto: InputCreatePostForBlogDto,
    public blogId: string,
    public userId: string,
  ) {}
}
@CommandHandler(CreatePostForBlogCommand)
export class CreatePostForBlogUseCase {
  constructor(
    protected blogsRepo: BlogsRepository,
    protected postsRepo: PostsRepository,
  ) {}
  async execute(
    command: CreatePostForBlogCommand,
  ): Promise<PostViewModelType | null> {
    const foundBlog = await this.blogsRepo.getBlogById(command.blogId);
    if (!foundBlog) throw new NotFoundException(['wrong blog id']);
    if (foundBlog.ownerId !== command.userId) throw new ForbiddenException();
    const result = await this.postsRepo.createPost(
      command.createPostDto.title,
      command.createPostDto.shortDescription,
      command.createPostDto.shortDescription,
      command.blogId,
      foundBlog.ownerId,
    );
    return {
      id: result.id,
      title: result.title,
      shortDescription: result.shortDescription,
      content: result.content,
      blogId: result.blogId,
      blogName: foundBlog.name,
      createdAt: result.createdAt.toISOString(),
      extendedLikesInfo: {
        likesCount: result.likesCount,
        dislikesCount: result.dislikesCount,
        myStatus: 'None',
        newestLikes: [],
      },
      images: {
        main: [],
      },
    };
  }
}
