import { S3StorageAdapter } from '../../../file-storage/files-storage.adapter';
import { CommandHandler } from '@nestjs/cqrs';
import { BlogImage } from '../../../images/entities/blog-image.entity';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { BlogsRepository } from '../../../blogs/blogs.repository';
import { v4 as uuidv4 } from 'uuid';
import { ImageTypes } from '../../../base/application-helpers/image.types';
import { getFileExtension } from '../../../base/application-helpers/get.file.extension';
import { allowedImageFileExtensions } from '../../../base/application-helpers/allowed.image.file.extensions';

export class UploadBlogImageCommand {
  constructor(
    public imageBuffer: Buffer,
    public imageFileSize: number,
    public blogId: string,
    public filename: string,
    public userId: string,
  ) {}
}

@CommandHandler(UploadBlogImageCommand)
export class UploadBlogImageUseCase {
  constructor(
    protected s3StorageAdapter: S3StorageAdapter,
    protected blogsRepo: BlogsRepository,
  ) {}
  async execute(command: UploadBlogImageCommand): Promise<BlogImage> {
    const blog = await this.blogsRepo.getBlogById(command.blogId);
    if (!blog) throw new NotFoundException();
    if (blog.ownerId !== command.userId) throw new ForbiddenException();
    const fileExtension = getFileExtension(command.filename);
    if (!allowedImageFileExtensions.includes(fileExtension))
      throw new BadRequestException();
    const maxFileSize = 100 * 1024;
    if (command.imageFileSize > maxFileSize) throw new ForbiddenException();
    const key = `${command.blogId}/images/main/${command.filename}`;
    const uploadResult = this.s3StorageAdapter.uploadImage(
      key,
      command.imageBuffer,
    );
    const imageId = uuidv4();
    const blogImage = BlogImage.instantiate(
      imageId,
      blogId,
      ImageTypes.main,
      key,
    );
  }
}
