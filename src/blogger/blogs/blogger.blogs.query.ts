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
import { User } from '../../users/etities/user.entity';
import { isVoid } from '../../application-helpers/void.check.helper';
import { CommentLike } from '../../likes/entities/comment-like.entity';

@Injectable()
export class BloggerBlogsQuery extends BlogsQuery {
  constructor(
    @InjectRepository(Blog) protected blogsRepo: Repository<Blog>,
    @InjectRepository(Post) protected postsRepo: Repository<Post>,
    @InjectRepository(Comment) protected commentsRepo: Repository<Comment>,
    @InjectRepository(User) protected usersRepo: Repository<User>,
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
    const [reqPageDbComments, allCommentsCount] = await this.commentsRepo
      .createQueryBuilder('c')
      .select()
      .leftJoin('c.post', 'p')
      .where(`p."ownerId" = :ownerId`, { ownerId: userId })
      .orderBy(`"${q.sortBy}"`, q.sortDirection)
      .limit(q.pageSize)
      .offset(offsetSize)
      .getManyAndCount();
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
    const blog: Blog = await this.blogsRepo.findOneBy({ id: post.blogId });
    const user: User = await this.usersRepo.findOneBy({ id: comment.userId });
    const like = await this.getUserLikeForComment(userId, comment.id);
    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      commentatorInfo: {
        userId: comment.userId,
        userLogin: user.login,
      },
      likesInfo: {
        likesCount: comment.likesCount,
        dislikesCount: comment.dislikesCount,
        myStatus: like?.likeStatus || LikeStatus.none,
      },
      postInfo: {
        blogId: post.blogId,
        blogName: blog.name,
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
      return await this.commentLikeRepo
        .createQueryBuilder('lc')
        .select()
        .leftJoin('lc.user', 'u')
        .leftJoin('u.userGlobalBan', 'ub')
        .where(`lc."commentId" = :commentId`, { commentId: commentId })
        .andWhere(`lc."userId" = :userId`, { userId: userId })
        .andWhere(`ub."isBanned" = false`)
        .getOne();
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}
