import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { PostMainImage } from './entities/post-main-image.entity';

@Injectable()
export class PostMainImagesRepository {
  constructor(
    @InjectRepository(PostMainImage)
    protected postMainImagesRepo: Repository<PostMainImage>,
  ) {}
  async getMainImagesInfo(postId: string): Promise<PostMainImage[]> {
    try {
      return await this.postMainImagesRepo.findBy({
        postId: postId,
      });
    } catch (e) {
      console.log(e);
      return null;
    }
  }
  async createMainImageInfo(
    postId: string,
    url: string,
    width: number,
    height: number,
    fileSize: number,
  ): Promise<PostMainImage> {
    try {
      const imageId = uuidv4();
      const newImage = PostMainImage.instantiate(
        imageId,
        postId,
        url,
        width,
        height,
        fileSize,
      );
      await this.postMainImagesRepo.save(newImage);
      return newImage;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}
