import { Injectable, NotFoundException } from '@nestjs/common';
import {
  pickOrderForPostsQuery,
  QueryParserType,
} from '../base/application-helpers/query-parser-type';
import { PostJoinedType, PostViewModelType } from './types/posts.types';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { Blog } from '../blogs/entities/blog.entity';
import { PostLike } from '../likes/entities/post-like.entity';
import { PaginatorType } from '../base/application-helpers/paginator.type';
import { emptyPaginatorStub } from '../base/application-helpers/empty.paginator.stub';
import { LikeStatus } from '../base/application-helpers/statuses';

@Injectable()
export class PostsQuery {
  constructor(
    @InjectRepository(Post) protected postsRepo: Repository<Post>,
    @InjectRepository(Blog) protected blogsRepo: Repository<Blog>,
    @InjectRepository(PostLike) protected postLikeRepo: Repository<PostLike>,
    @InjectDataSource() protected dataSource: DataSource,
  ) {}
  async viewAllPosts(
    q: QueryParserType,
    activeUserId: string,
  ): Promise<PaginatorType<PostViewModelType>> {
    const offsetSize = (q.pageNumber - 1) * q.pageSize;
    const queryString = `
        SELECT p."id", p."title", p."shortDescription", 
        p."content", p."blogId", b."name" as "blogName", p."createdAt", 
        p."ownerId", ub."isBanned" as "ownerIsBanned", p."likesCount", 
        p."dislikesCount", b."isBanned" as "parentBlogIsBanned"
        FROM "post" as p
        JOIN "blog" as b
        ON p."blogId" = b."id"
        JOIN "user_global_ban" as ub
        ON p."ownerId" = ub."userId"
        WHERE ub."isBanned" = false AND b."isBanned" = false
        ${pickOrderForPostsQuery(q.sortBy, q.sortDirection)}
        LIMIT $1 OFFSET $2
      `;
    const countString = `
        SELECT COUNT(*)
        FROM "post" AS p
        JOIN "user_global_ban" AS ub
        ON p."ownerId" = ub."userId"
        JOIN "blog" as b
        ON p."blogId" = b."id"
        WHERE ub."isBanned" = false AND b."isBanned" = false`;
    const reqPageDbPosts: PostJoinedType[] = await this.dataSource.query(
      queryString,
      [q.pageSize, offsetSize],
    );
    const allPostsCount: number = parseInt(
      (await this.dataSource.query(countString))[0].count,
      10,
    );
    if (allPostsCount === 0) return emptyPaginatorStub;
    const items = [];
    for await (const p of reqPageDbPosts) {
      const post = await this._mapJoinedPostToViewType(p, activeUserId);
      items.push(post);
    }
    return {
      pagesCount: Math.ceil(allPostsCount / q.pageSize),
      page: q.pageNumber,
      pageSize: q.pageSize,
      totalCount: allPostsCount,
      items: items,
    };
  }
  async findPostById(
    postId: string,
    activeUserId: string,
  ): Promise<PostViewModelType | null> {
    const post = await this.postsRepo.findOne({
      where: {
        id: postId,
        owner: {
          userGlobalBan: {
            isBanned: false,
          },
        },
        blog: { isBanned: false },
      },
      relations: {
        blog: true,
        owner: {
          userGlobalBan: true,
        },
      },
    });
    if (!post) throw new NotFoundException();
    return this._mapPostToViewType(post, activeUserId);
  }
  async findPostsByBlogId(
    blogId: string,
    q: QueryParserType,
    activeUserId: string,
  ): Promise<PaginatorType<PostViewModelType> | null> {
    const blog: Blog = await this.blogsRepo.findOneBy({
      id: blogId,
    });
    if (!blog) throw new NotFoundException();
    const offsetSize = (q.pageNumber - 1) * q.pageSize;
    const [reqPageDbPosts, foundPostsCount] = await this.postsRepo.findAndCount(
      {
        where: {
          blogId: blogId,
          owner: {
            userGlobalBan: {
              isBanned: false,
            },
          },
          blog: { isBanned: false },
        },
        order: { [q.sortBy]: q.sortDirection },
        take: q.pageSize,
        skip: offsetSize,
        relations: {
          blog: true,
          owner: {
            userGlobalBan: true,
          },
        },
      },
    );
    if (foundPostsCount === 0) return null;
    const items = [];
    for await (const p of reqPageDbPosts) {
      const post = await this._mapPostToViewType(p, activeUserId);
      items.push(post);
    }
    return {
      pagesCount: Math.ceil(foundPostsCount / q.pageSize),
      page: q.pageNumber,
      pageSize: q.pageSize,
      totalCount: foundPostsCount,
      items: items,
    };
  }

  async getUserLikeForPost(userId: string, postId: string): Promise<PostLike> {
    try {
      return await this.postLikeRepo.findOne({
        where: {
          postId: postId,
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
      return;
    }
  }
  private async _getNewestLikes(postId: string): Promise<Array<PostLike>> {
    try {
      return await this.postLikeRepo.find({
        where: {
          postId: postId,
          likeStatus: LikeStatus.like,
          user: {
            userGlobalBan: {
              isBanned: false,
            },
          },
        },
        order: {
          addedAt: 'DESC',
        },
        take: 3,
        skip: 0,
        relations: {
          user: {
            userGlobalBan: true,
          },
        },
      });
    } catch (e) {
      console.log(e);
      return;
    }
  }
  async _mapPostToViewType(
    post: Post,
    activeUserId: string,
  ): Promise<PostViewModelType> {
    if (activeUserId === '')
      activeUserId = '3465cc2e-f49b-11ed-a05b-0242ac120003';
    const userLike = await this.getUserLikeForPost(activeUserId, post.id);
    const newestLikes = await this._getNewestLikes(post.id);
    const mappedLikes = newestLikes.map((l) => {
      return {
        addedAt: new Date(l.addedAt).toISOString(),
        userId: l.userId,
        login: l.user.login,
      };
    });
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blog.name,
      createdAt: new Date(post.createdAt).toISOString(),
      extendedLikesInfo: {
        likesCount: post.likesCount,
        dislikesCount: post.dislikesCount,
        myStatus: userLike?.likeStatus || LikeStatus.none,
        newestLikes: mappedLikes,
      },
    };
  }
  async _mapJoinedPostToViewType(
    post: PostJoinedType,
    activeUserId: string,
  ): Promise<PostViewModelType> {
    if (activeUserId === '')
      activeUserId = '3465cc2e-f49b-11ed-a05b-0242ac120003';
    const userLike = await this.getUserLikeForPost(activeUserId, post.id);
    const newestLikes = await this._getNewestLikes(post.id);
    const mappedLikes = newestLikes.map((l) => {
      return {
        addedAt: new Date(l.addedAt).toISOString(),
        userId: l.userId,
        login: l.user.login,
      };
    });
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: new Date(post.createdAt).toISOString(),
      extendedLikesInfo: {
        likesCount: post.likesCount,
        dislikesCount: post.dislikesCount,
        myStatus: userLike?.likeStatus || LikeStatus.none,
        newestLikes: mappedLikes,
      },
    };
  }
}
