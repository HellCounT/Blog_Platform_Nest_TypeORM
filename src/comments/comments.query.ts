import { QueryParser } from '../application-helpers/query.parser';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CommentViewDto } from './dto/output.comment.view.dto';
import { CommentPaginatorDto } from './dto/output.comment-paginator.dto';
import { LikeStatus } from '../likes/types/likes.types';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { isVoid } from '../application-helpers/void.check.helper';
import { CommentLike } from '../likes/entities/comment-like.entity';

@Injectable()
export class CommentsQuery {
  constructor(
    @InjectRepository(Comment) protected commentRepo: Repository<Comment>,
    @InjectRepository(CommentLike)
    protected commentLikeRepo: Repository<CommentLike>,
  ) {}
  async findCommentById(
    commentId: string,
    activeUserId: string,
  ): Promise<CommentViewDto | null> {
    const comment = await this.commentRepo.findOne({
      where: {
        id: commentId,
        user: {
          userGlobalBan: {
            isBanned: false,
          },
        },
      },
      relations: {
        user: {
          userGlobalBan: true,
        },
      },
    });
    if (isVoid(comment)) throw new NotFoundException();
    return this._mapCommentToViewType(comment, activeUserId);
  }
  async findCommentsByPostId(
    postId: string,
    q: QueryParser,
    activeUserId = '',
  ): Promise<CommentPaginatorDto | null> {
    const offsetSize = (q.pageNumber - 1) * q.pageSize;
    const [reqPageDbComments, foundCommentsCount] =
      await this.commentRepo.findAndCount({
        where: {
          postId: postId,
          user: {
            userGlobalBan: {
              isBanned: false,
            },
          },
        },
        order: { [q.sortBy]: q.sortDirection },
        take: q.pageSize,
        skip: offsetSize,
        relations: {
          user: {
            userGlobalBan: true,
          },
        },
      });
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
      return await this.commentLikeRepo.findOne({
        where: {
          commentId: commentId,
          userId: userId,
          user: {
            userGlobalBan: {
              isBanned: false,
            },
          },
        },
        relations: {
          user: {
            userGlobalBan: true,
          },
        },
      });
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
    return {
      id: comment.id,
      content: comment.content,
      commentatorInfo: {
        userId: comment.userId,
        userLogin: comment.user.login,
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
