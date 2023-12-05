import { CommandHandler } from '@nestjs/cqrs';
import { S3StorageAdapter } from '../../../file-storage/files-storage.adapter';
import { BlogsRepository } from '../../../blogs/blogs.repository';
import { PostsRepository } from '../../../posts/posts.repository';
import { OutputPostImageDto } from '../../../posts/dto/output.post-image.dto';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getFileExtension } from '../../../base/application-helpers/get.file.extension';
import { allowedImageFileExtensions } from '../../../base/application-helpers/allowed.image.file.extensions';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { PostMainImage } from '../../../images/entities/post-main-image.entity';
import { PostMainImageSizes } from '../../../base/application-helpers/post.main.image.types';
import { PostMainImagesRepository } from '../../../images/post-main-images.repository';

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
    protected postMainImagesRepo: PostMainImagesRepository,
  ) {}
  async execute(command: UploadPostImageCommand): Promise<OutputPostImageDto> {
    const blog = await this.blogsRepo.getBlogById(command.blogId);
    const post = await this.postsRepo.getPostById(command.postId);
    if (!post || !blog) throw new NotFoundException();
    if (blog.ownerId !== command.userId) throw new ForbiddenException();
    const fileExtension = getFileExtension(command.filename);
    if (!allowedImageFileExtensions.includes(fileExtension))
      throw new BadRequestException();
    const maxFileSize = 100 * 1024;
    if (command.imageFileSize > maxFileSize) throw new ForbiddenException();
    const metadata = await sharp(command.imageBuffer).metadata();
    if (metadata.width !== 940 || metadata.height !== 432)
      throw new BadRequestException();
    const middleWidth = 300;
    const smallWidth = 149;
    const middleHeight = 180;
    const smallHeight = 96;
    try {
      const originalImageId = uuidv4();
      const middleImageId = uuidv4();
      const smallImageId = uuidv4();
      const originalImageKey = `${command.blogId}/posts/${command.postId}/images/${command.filename}`;
      const middleImageKey = `${command.blogId}/posts/${command.postId}/images/${command.filename}_middle`;
      const smallImageKey = `${command.blogId}/posts/${command.postId}/images/${command.filename}_small`;
      const middleImageBuffer = await sharp(command.imageBuffer)
        .resize({
          width: middleWidth,
          height: middleHeight,
        })
        .toBuffer();
      const smallImageBuffer = await sharp(command.imageBuffer)
        .resize({
          width: smallWidth,
          height: smallHeight,
        })
        .toBuffer();
      // image entities creation
      const originalImage = PostMainImage.instantiate(
        originalImageId,
        command.postId,
        PostMainImageSizes.original,
        originalImageKey,
        metadata.width,
        metadata.height,
        command.imageFileSize,
      );
      const middleImage = PostMainImage.instantiate(
        middleImageId,
        command.postId,
        PostMainImageSizes.medium,
        middleImageKey,
        middleWidth,
        middleHeight,
        command.imageFileSize,
      );
      const smallImage = PostMainImage.instantiate(
        smallImageId,
        command.postId,
        PostMainImageSizes.small,
        smallImageKey,
        smallWidth,
        smallHeight,
        command.imageFileSize,
      );
      await this.s3StorageAdapter.uploadImage(
        originalImageKey,
        command.imageBuffer,
      );
      await this.s3StorageAdapter.uploadImage(
        middleImageKey,
        middleImageBuffer,
      );
      await this.s3StorageAdapter.uploadImage(smallImageKey, smallImageBuffer);
      await this.postMainImagesRepo.save(originalImage);
      await this.postMainImagesRepo.save(middleImage);
      await this.postMainImagesRepo.save(smallImage);
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}
