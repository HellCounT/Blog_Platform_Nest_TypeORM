import { CommandHandler } from '@nestjs/cqrs';
import { InputBlogCreateDto } from '../dto/input.create-blog.dto';
import { BlogsRepository } from '../../../blogs/blogs.repository';
import { BlogViewModelType } from '../../../blogs/types/blogs.types';
import { UsersRepository } from '../../../users/users.repository';
import { UnauthorizedException } from '@nestjs/common';

export class CreateBlogCommand {
  constructor(
    public blogCreateDto: InputBlogCreateDto,
    public userId: string,
  ) {}
}
@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase {
  constructor(
    protected blogsRepo: BlogsRepository,
    protected usersRepo: UsersRepository,
  ) {}
  async execute(command: CreateBlogCommand): Promise<BlogViewModelType> {
    const user = await this.usersRepo.getUserById(command.userId);
    if (!user) throw new UnauthorizedException(['wrong user id']);
    const result = await this.blogsRepo.createBlog(
      command.blogCreateDto.name,
      command.blogCreateDto.description,
      command.blogCreateDto.websiteUrl,
      command.userId,
    );
    return {
      id: result.id,
      name: result.name,
      description: result.description,
      websiteUrl: result.websiteUrl,
      createdAt: result.createdAt,
      isMembership: result.isMembership,
      images: {
        wallpaper: null,
        main: [],
      },
    };
  }
}
