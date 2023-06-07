import { Injectable } from '@nestjs/common';
import { LikeStatus } from './types/likes.types';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostLike } from './entities/post-like.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LikesForPostsRepository {
  constructor(
    @InjectRepository(PostLike) protected postLikeRepo: Repository<PostLike>,
  ) {}
  async createNewLike(
    postId: string,
    userId: string,
    likeStatus: LikeStatus,
  ): Promise<void> {
    try {
      const postLikeId = uuidv4();
      const newPostLike = PostLike.instantiate(
        postLikeId,
        postId,
        userId,
        likeStatus,
      );
      await this.postLikeRepo.save(newPostLike);
      return;
    } catch (e) {
      console.log(e);
      return;
    }
  }
  async updateLikeStatus(
    postId: string,
    userId: string,
    likeStatus: LikeStatus,
  ): Promise<void> {
    try {
      await this.postLikeRepo.update(
        { postId: postId, userId: userId },
        {
          likeStatus: likeStatus,
        },
      );
      return;
    } catch (e) {
      console.log(e);
      return;
    }
  }
  async deleteAllLikesWhenPostIsDeleted(postId: string): Promise<void> {
    try {
      await this.postLikeRepo.delete({ postId: postId });
      return;
    } catch (e) {
      console.log(e);
      return;
    }
  }
  async getByUserId(userId: string): Promise<PostLike[]> {
    try {
      return await this.postLikeRepo.findBy({ userId: userId });
    } catch (e) {
      console.log(e);
      return;
    }
  }
  async getNewLikesCounter(
    postId: string,
    likeStatus: LikeStatus,
  ): Promise<number> {
    try {
      return await this.postLikeRepo
        .createQueryBuilder('l')
        .select()
        .leftJoin('user_global_ban', 'b', 'l.userId = b.userId')
        .where('l.postId = :postId', { postId })
        .andWhere('l.likeStatus = :likeStatus', { likeStatus: likeStatus })
        .andWhere('b.isBanned = :isBanned', { isBanned: false })
        .getCount();
      // const counterResult = await this.dataSource.query(
      //   `
      //   SELECT COUNT(*)
      //   FROM "LIKES_FOR_POSTS" as l
      //   LEFT JOIN "USERS_GLOBAL_BAN" as b
      //   ON l."userId" = b."userId"
      //   WHERE (l."postId" = $1 AND l."likeStatus" = $2) AND b."isBanned" = false
      //   `,
      //   [postId, LikeStatus.like],
      // );
      // return parseInt(counterResult[0].count, 10);
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}
