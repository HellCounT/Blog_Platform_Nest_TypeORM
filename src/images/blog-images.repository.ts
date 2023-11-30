import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BlogImage } from './entities/blog-image.entity';
import { Repository } from 'typeorm';
import { ImageTypes } from '../base/application-helpers/image.types';
import { isVoid } from '../base/application-helpers/void.check.helper';

@Injectable()
export class BlogImagesRepository {
  constructor(
    @InjectRepository(BlogImage)
    protected blogImagesRepo: Repository<BlogImage>,
  ) {}
  async getWallpaperInfo(blogId: string): Promise<BlogImage> {
    try {
      const wallpaper = await this.blogImagesRepo.findOne({
        where: {
          blogId: blogId,
          imageType: ImageTypes.wallpaper,
        },
        order: { uploadedAt: 'DESC' },
      });
      if (isVoid(wallpaper)) return null;
      return wallpaper;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
  async getMainImagesInfo(blogId: string): Promise<BlogImage[]> {
    try {
      return await this.blogImagesRepo.findBy({
        blogId: blogId,
        imageType: ImageTypes.main,
      });
    } catch (e) {
      console.log(e);
      return null;
    }
  }
  async createImageInfo(
    imageId: string,
    blogId: string,
    imageType: ImageTypes,
    url: string,
    width: number,
    height: number,
    fileSize: number,
  ): Promise<BlogImage> {
    try {
      const newImage = BlogImage.instantiate(
        imageId,
        blogId,
        imageType,
        url,
        width,
        height,
        fileSize,
      );
      await this.blogImagesRepo.save(newImage);
      return newImage;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}
