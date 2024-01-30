import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostMainImage } from './entities/post-main-image.entity';

@Injectable()
export class PostMainImagesRepository {
  constructor(
    @InjectRepository(PostMainImage)
    protected postMainImagesRepo: Repository<PostMainImage>,
  ) {}
  // async getMainImagesInfo(postId: string): Promise<PostMainImage[]> {
  //   try {
  //     return await this.postMainImagesRepo.findBy({
  //       postId: postId,
  //     });
  //   } catch (e) {
  //     console.log(e);
  //     return null;
  //   }
  // }
  async save(postMainImage: PostMainImage): Promise<PostMainImage> {
    try {
      return this.postMainImagesRepo.save(postMainImage);
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}
