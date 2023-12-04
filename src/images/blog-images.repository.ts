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
  async save(blogImage: BlogImage): Promise<BlogImage> {
    try {
      return this.blogImagesRepo.save(blogImage);
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}
