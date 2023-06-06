import { QueryParser } from '../application-helpers/query.parser';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CommentViewDto } from './dto/output.comment.view.dto';
import { CommentPaginatorDto } from './dto/output.comment-paginator.dto';
import { LikeStatus } from '../likes/types/likes.types';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { isVoid } from '../application-helpers/void.check.helper';
import { User } from '../users/etities/user.entity';
import { CommentLike } from '../likes/entities/comment-like.entity';

@Injectable()
export class CommentsQuery {
  constructor(
    @InjectRepository(Comment) protected commentRepo: Repository<Comment>,
    @InjectRepository(User) protected usersRepo: Repository<User>,
    @InjectRepository(CommentLike)
    protected commentLikeRepo: Repository<CommentLike>,
  ) {}
  async findCommentById(
    commentId: string,
    activeUserId: string,
  ): Promise<CommentViewDto | null> {
    const comment = await this.commentRepo
      .createQueryBuilder('c')
      .select()
      .leftJoin('c.user', 'u')
      .leftJoin(`u."userGlobalBan"`, 'ub')
      .where(`c."id" = :commentId`, { commentId: commentId })
      .andWhere(`ub."isBanned" = false`)
      .getOne();
    if (isVoid(comment)) throw new NotFoundException();
    return this._mapCommentToViewType(comment, activeUserId);
  }
  async findCommentsByPostId(
    postId: string,
    q: QueryParser,
    activeUserId = '',
  ): Promise<CommentPaginatorDto | null> {
    const offsetSize = (q.pageNumber - 1) * q.pageSize;
    const [reqPageDbComments, foundCommentsCount] = await this.commentRepo
      .createQueryBuilder('c')
      .select()
      .leftJoin('c.user', 'u')
      .leftJoin(`u."userGlobalBan"`, 'ub')
      .where(`c."postId" = :postId`, { postId: postId })
      .andWhere(`ub."isBanned" = false`)
      .orderBy(`"${q.sortBy}"`, q.sortDirection)
      .limit(q.pageSize)
      .offset(offsetSize)
      .getManyAndCount();
    const items = [];
    for await (const c of reqPageDbComments) {
      const comment = await this._mapCommentToViewType(c, activeUserId);
      items.push(comment);
    }
    return {
      pagesCount: Math.ceil(foundCommentsCount / q.pageSize),
      page: q.pageNumber,
      pageSize: q.pageSize,
      totalCount: foundCommentsCount,
      items: items,
    };
  }
  async getUserLikeForComment(
    userId: string,
    commentId: string,
  ): Promise<CommentLike | null> {
    try {
      return await this.commentLikeRepo
        .createQueryBuilder('lc')
        .select()
        .leftJoin('lc.user', 'u')
        .leftJoin(`u."userGlobalBan"`, 'ub')
        .where(`lc."commentId" = :commentId`, { commentId: commentId })
        .andWhere(`lc."userId" = :userId`, { userId: userId })
        .andWhere(`ub."isBanned" = false`)
        .getOne();
    } catch (e) {
      console.log(e);
      return null;
    }
  }
  async _mapCommentToViewType(
    comment: Comment,
    activeUserId: string,
  ): Promise<CommentViewDto> {
    if (activeUserId === '')
      activeUserId = '3465cc2e-f49b-11ed-a05b-0242ac120003';
    const like = await this.getUserLikeForComment(activeUserId, comment.id);
    const user = await this.usersRepo.findOneBy({ id: comment.userId });
    return {
      id: comment.id,
      content: comment.content,
      commentatorInfo: {
        userId: comment.userId,
        userLogin: user.login,
      },
      createdAt: comment.createdAt.toISOString(),
      likesInfo: {
        likesCount: comment.likesCount,
        dislikesCount: comment.dislikesCount,
        myStatus: like?.likeStatus || LikeStatus.none,
      },
    };
  }
}
