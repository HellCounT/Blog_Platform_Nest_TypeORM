import { LikesForPostsRepository } from './likes-for-posts.repository';
import { Injectable } from '@nestjs/common';
import { LikeStatus } from '../base/application-helpers/statuses';

@Injectable()
export class LikesForPostsService {
  constructor(protected likesForPostsRepo: LikesForPostsRepository) {}
  async createNewLike(
    postId: string,
    userId: string,
    likeStatus: LikeStatus,
  ): Promise<void> {
    await this.likesForPostsRepo.createNewLike(postId, userId, likeStatus);
    return;
  }
  async updateLikeStatus(
    postId: string,
    userId: string,
    likeStatus: LikeStatus,
  ): Promise<void> {
    await this.likesForPostsRepo.updateLikeStatus(postId, userId, likeStatus);
    return;
  }
  async deleteAllLikesWhenPostIsDeleted(postId: string): Promise<void> {
    await this.likesForPostsRepo.deleteAllLikesWhenPostIsDeleted(postId);
    return;
  }
}
