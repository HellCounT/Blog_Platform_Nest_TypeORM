import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BlogImage } from './entities/blog-image.entity';
import { Repository } from 'typeorm';
import { ImageTypes } from '../base/application-helpers/image.types';
import { isVoid } from '../base/application-helpers/void.check.helper';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BlogImagesRepository {
  constructor(
    @InjectRepository(BlogImage) protected blogImages: Repository<BlogImage>,
  ) {}
  async getWallpaperInfo(blogId: string): Promise<BlogImage> {
    try {
      const wallpaper = await this.blogImages.findOne({
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
      return await this.blogImages.findBy({
        blogId: blogId,
        imageType: ImageTypes.main,
      });
    } catch (e) {
      console.log(e);
      return null;
    }
  }
  async createImageInfo(
    blogId: string,
    imageType: ImageTypes,
    url: string,
    width: number,
    height: number,
    fileSize: number,
  ): Promise<BlogImage> {
    try {
      const imageId = uuidv4();
      const newImage = BlogImage.instantiate(
        imageId,
        blogId,
        imageType,
        url,
        width,
        height,
        fileSize,
      );
      await this.blogImages.save(newImage);
      return newImage;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}
