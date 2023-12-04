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
import sharp from 'sharp';
import { BlogImagesRepository } from '../../../images/blog-images.repository';

export class UploadBlogImageCommand {
  constructor(
    public imageBuffer: Buffer,
    public imageFileSize: number,
    public blogId: string,
    public filename: string,
    public userId: string,
    public blogImageType: ImageTypes,
  ) {}
}

@CommandHandler(UploadBlogImageCommand)
export class UploadBlogImageUseCase {
  constructor(
    protected s3StorageAdapter: S3StorageAdapter,
    protected blogsRepo: BlogsRepository,
    protected blogImagesRepo: BlogImagesRepository,
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
    const metadata = await sharp(command.imageBuffer).metadata();
    const imageId = uuidv4();
    // wallpaper
    if (command.blogImageType === ImageTypes.wallpaper) {
      if (metadata.width !== 1028 || metadata.height !== 312)
        throw new BadRequestException();
      try {
        const key = `${command.blogId}/images/wallpaper/${command.filename}`;
        await this.s3StorageAdapter.uploadImage(key, command.imageBuffer);
        const wallpaper = BlogImage.instantiate(
          imageId,
          blog.id,
          command.blogImageType,
          key,
          metadata.width,
          metadata.height,
          command.imageFileSize,
        );
        return await this.blogImagesRepo.save(wallpaper);
      } catch (e) {
        console.log(e);
        return null;
      } // main
    } else {
      if (metadata.width !== 156 || metadata.height !== 156)
        throw new BadRequestException();
      try {
        const key = `${command.blogId}/images/main/${command.filename}`;
        await this.s3StorageAdapter.uploadImage(key, command.imageBuffer);
        const mainImage = BlogImage.instantiate(
          imageId,
          blog.id,
          command.blogImageType,
          key,
          metadata.width,
          metadata.height,
          command.imageFileSize,
        );
        return await this.blogImagesRepo.save(mainImage);
      } catch (e) {
        console.log(e);
        return null;
      }
    }
  }
}
