import { CommandHandler } from '@nestjs/cqrs';
import { S3StorageAdapter } from '../../../file-storage/files-storage.adapter';
import { BlogsRepository } from '../../../blogs/blogs.repository';
import { PostsRepository } from '../../../posts/posts.repository';
import { OutputPostImageDto } from '../../../posts/dto/output.post-image.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getFileExtension } from '../../../base/application-helpers/get.file.extension';

export class UploadPostImageCommand {
  constructor(
    public imageBuffer: Buffer,
    public imageFileSize: number,
    public blogId: string,
    public postId: string,
    public filename: string,
    public userId: string,
  ) {}
}
@CommandHandler(UploadPostImageCommand)
export class UploadPostImageUseCase {
  constructor(
    protected s3StorageAdapter: S3StorageAdapter,
    protected blogsRepo: BlogsRepository,
    protected postsRepo: PostsRepository,
  ) {}
  async execute(command: UploadPostImageCommand): Promise<OutputPostImageDto> {
    const blog = await this.blogsRepo.getBlogById(command.blogId);
    const post = await this.postsRepo.getPostById(command.postId);
    if (!post || !blog) throw new NotFoundException();
    if (blog.ownerId !== command.userId) throw new ForbiddenException();
    const fileExtension = getFileExtension(command.filename);
  }
}
