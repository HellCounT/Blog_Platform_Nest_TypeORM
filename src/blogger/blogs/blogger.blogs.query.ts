import { Injectable } from '@nestjs/common';
import { QueryParser } from '../../application-helpers/query.parser';
import { BlogViewModelType } from '../../blogs/types/blogs.types';
import { BlogsQuery } from '../../blogs/blogs.query';
import { CommentForBloggerViewType } from './dto/output.comments.paginator.blogger.dto';
import { LikeStatus } from '../../likes/types/likes.types';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginatorType } from '../../application-helpers/paginator.type';
import { Blog } from '../../blogs/entities/blog.entity';
import { Post } from '../../posts/entities/post.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { isVoid } from '../../application-helpers/void.check.helper';
import { CommentLike } from '../../likes/entities/comment-like.entity';

@Injectable()
export class BloggerBlogsQuery extends BlogsQuery {
  constructor(
    @InjectRepository(Blog) protected blogsRepo: Repository<Blog>,
    @InjectRepository(Post) protected postsRepo: Repository<Post>,
    @InjectRepository(Comment) protected commentsRepo: Repository<Comment>,
    @InjectRepository(CommentLike)
    protected commentLikeRepo: Repository<CommentLike>,
  ) {
    super(blogsRepo);
  }
  async getAllBlogsForBlogger(
    q: QueryParser,
    userId,
  ): Promise<PaginatorType<BlogViewModelType>> {
    const offsetSize = (q.pageNumber - 1) * q.pageSize;
    const [reqPageDbBlogs, allBlogsCount] = await this.blogsRepo
      .createQueryBuilder('b')
      .select()
      .where(`b."ownerId" = :ownerId`, { ownerId: userId })
      .andWhere(`b."name" ILIKE '%' || COALESCE(:searchNameTerm, '') || '%'`, {
        searchNameTerm: q.searchNameTerm,
      })
      .orderBy(`"${q.sortBy}"`, q.sortDirection)
      .limit(q.pageSize)
      .offset(offsetSize)
      .getManyAndCount();
    const pageBlogs = reqPageDbBlogs.map((b) => this._mapBlogToViewType(b));
    return {
      pagesCount: Math.ceil(allBlogsCount / q.pageSize),
      page: q.pageNumber,
      pageSize: q.pageSize,
      totalCount: allBlogsCount,
      items: pageBlogs,
    };
  }
  async getAllCommentsForBloggerPosts(
    q: QueryParser,
    userId: string,
  ): Promise<PaginatorType<CommentForBloggerViewType>> {
    const offsetSize = (q.pageNumber - 1) * q.pageSize;
    const [reqPageDbComments, allCommentsCount] =
      await this.commentsRepo.findAndCount({
        where: {
          post: {
            ownerId: userId,
          },
        },
        order: { [q.sortBy]: q.sortDirection },
        take: q.pageSize,
        skip: offsetSize,
        relations: {
          user: true,
          post: {
            blog: true,
            owner: true,
          },
        },
      });
    if (allCommentsCount === 0) return null;
    const items = [];
    for await (const c of reqPageDbComments) {
      const comment = await this._mapCommentToBloggerViewType(c, userId);
      items.push(comment);
    }
    return {
      pagesCount: Math.ceil(allCommentsCount / q.pageSize),
      page: q.pageNumber,
      pageSize: q.pageSize,
      totalCount: allCommentsCount,
      items: items,
    };
  }
  private async _mapCommentToBloggerViewType(
    comment: Comment,
    userId: string,
  ): Promise<CommentForBloggerViewType> {
    const post: Post = await this.postsRepo.findOneBy({
      id: comment.postId,
    });
    if (isVoid(post)) return null;
    const like = await this.getUserLikeForComment(userId, comment.id);
    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      commentatorInfo: {
        userId: comment.userId,
        userLogin: comment.user.login,
      },
      likesInfo: {
        likesCount: comment.likesCount,
        dislikesCount: comment.dislikesCount,
        myStatus: like?.likeStatus || LikeStatus.none,
      },
      postInfo: {
        blogId: post.blogId,
        blogName: comment.post.blog.name,
        title: post.title,
        id: comment.postId,
      },
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
}
