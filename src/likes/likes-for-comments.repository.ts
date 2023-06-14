import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentLike } from './entities/comment-like.entity';
import { v4 as uuidv4 } from 'uuid';
import { LikeStatus } from '../application-helpers/statuses';

@Injectable()
export class LikesForCommentsRepository {
  constructor(
    @InjectRepository(CommentLike)
    protected commentLikeRepo: Repository<CommentLike>,
  ) {}
  async createNewLike(
    commentId: string,
    userId: string,
    likeStatus: LikeStatus,
  ): Promise<void> {
    try {
      const commentLikeId = uuidv4();
      const newCommentLike = CommentLike.instantiate(
        commentLikeId,
        commentId,
        userId,
        likeStatus,
      );
      await this.commentLikeRepo.save(newCommentLike);
      return;
    } catch (e) {
      console.log(e);
      return;
    }
  }
  async updateLikeStatus(
    commentId: string,
    userId: string,
    likeStatus: LikeStatus,
  ): Promise<void> {
    try {
      await this.commentLikeRepo.update(
        {
          commentId: commentId,
          userId: userId,
        },
        { likeStatus: likeStatus },
      );
      return;
    } catch (e) {
      console.log(e);
      return;
    }
  }
  async deleteAllLikesWhenCommentIsDeleted(commentId: string): Promise<void> {
    try {
      await this.commentLikeRepo.delete({ commentId: commentId });
      return;
    } catch (e) {
      console.log(e);
      return;
    }
  }
  async getByUserId(userId: string): Promise<CommentLike[]> {
    try {
      return await this.commentLikeRepo.findBy({ userId: userId });
    } catch (e) {
      console.log(e);
      return;
    }
  }
  async getNewLikesCounter(
    commentId: string,
    likeStatus: LikeStatus,
  ): Promise<number> {
    try {
      return await this.commentLikeRepo
        .createQueryBuilder('l')
        .select()
        .leftJoin('user_global_ban', 'b', 'l.userId = b.userId')
        .where('l.commentId = :commentId', { commentId })
        .andWhere('l.likeStatus = :likeStatus', { likeStatus: likeStatus })
        .andWhere('b.isBanned = :isBanned', { isBanned: false })
        .getCount();
      // const counterResult = await this.dataSource.query(
      //   `
      //   SELECT COUNT(*)
      //   FROM "LIKES_FOR_COMMENTS" as l
      //   LEFT JOIN "USERS_GLOBAL_BAN" as b
      //   ON l."userId" = b."userId"
      //   WHERE (l."commentId" = $1 AND l."likeStatus" = $2) AND b."isBanned" = false
      //   `,
      //   [commentId, LikeStatus.like],
      // );
      // return parseInt(counterResult[0].count, 10);
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}
