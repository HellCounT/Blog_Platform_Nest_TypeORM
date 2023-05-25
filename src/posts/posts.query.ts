import { Injectable, NotFoundException } from '@nestjs/common';
import {
  pickOrderForPostsQuery,
  QueryParser,
} from '../application-helpers/query.parser';
import {
  PostJoinedType,
  PostPaginatorType,
  PostViewModelType,
} from './types/posts.types';
import { LikeStatus, PostLikeJoinedType } from '../likes/types/likes.types';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Blog } from '../blogs/types/blogs.types';

@Injectable()
export class PostsQuery {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}
  async viewAllPosts(
    q: QueryParser,
    activeUserId: string,
  ): Promise<PostPaginatorType> {
    const allPostsCountResult = await this.dataSource.query(
      `
      SELECT COUNT(*)
      FROM "POSTS" AS p
      JOIN "USERS_GLOBAL_BAN" AS ub
      ON p."ownerId" = ub."userId"
      JOIN "BLOGS" as b
      ON p."blogId" = b."id"
      WHERE ub."isBanned" = false AND b."isBanned" = false
      `,
    );
    const allPostsCount: number = parseInt(allPostsCountResult[0].count, 10);
    const offsetSize = (q.pageNumber - 1) * q.pageSize;
    const reqPageDbPosts: PostJoinedType[] = await this.dataSource.query(
      `
        SELECT p."id", p."title", p."shortDescription", 
        p."content", p."blogId", b."name" as "blogName", p."createdAt", 
        p."ownerId", ub."isBanned" as "ownerIsBanned", p."likesCount", 
        p."dislikesCount", b."isBanned" as "parentBlogIsBanned"
        FROM "POSTS" as p
        JOIN "BLOGS" as b
        ON p."blogId" = b."id"
        JOIN "USERS_GLOBAL_BAN" as ub
        ON p."ownerId" = ub."userId"
        WHERE ub."isBanned" = false AND b."isBanned" = false
        ${pickOrderForPostsQuery(q.sortBy, q.sortDirection)}
        LIMIT $1 OFFSET $2
      `,
      [q.pageSize, offsetSize],
    );
    const items = [];
    for await (const p of reqPageDbPosts) {
      const post = await this._mapPostToViewType(p, activeUserId);
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
    const foundPostResult: PostJoinedType[] = await this.dataSource.query(
      `
        SELECT p."id", p."title", p."shortDescription", 
        p."content", p."blogId", b."name" as "blogName", p."createdAt", 
        p."ownerId", ub."isBanned" as "ownerIsBanned", p."likesCount", 
        p."dislikesCount", b."isBanned" as "parentBlogIsBanned"
        FROM "POSTS" as p
        JOIN "BLOGS" as b
        ON p."blogId" = b."id"
        JOIN "USERS_GLOBAL_BAN" as ub
        ON p."ownerId" = ub."userId"
        WHERE p."id" = $1 AND ub."isBanned" = false AND b."isBanned" = false
        `,
      [postId],
    );
    if (!foundPostResult[0]) throw new NotFoundException();
    return this._mapPostToViewType(foundPostResult[0], activeUserId);
  }
  async findPostsByBlogId(
    blogId: string,
    q: QueryParser,
    activeUserId: string,
  ): Promise<PostPaginatorType | null> {
    const foundBlogResult: Blog[] = await this.dataSource.query(
      `
        SELECT * FROM "BLOGS"
        WHERE "id" = $1
        `,
      [blogId],
    );
    if (foundBlogResult.length === 1) {
      const foundPostsCountResult = await this.dataSource.query(
        `
        SELECT COUNT(*)
        FROM "POSTS" AS p
        JOIN "BLOGS" as b
        ON p."blogId" = b."id"
        JOIN "USERS_GLOBAL_BAN" as ub
        ON p."ownerId" = ub."userId"
        WHERE b."id" = $1 AND ub."isBanned" = false AND b."isBanned" = false
        `,
        [blogId],
      );
      const foundPostsCount: number = parseInt(
        foundPostsCountResult[0].count,
        10,
      );
      const offsetSize = (q.pageNumber - 1) * q.pageSize;
      const reqPageDbPosts: PostJoinedType[] = await this.dataSource.query(
        `
        SELECT p."id", p."title", p."shortDescription", 
        p."content", p."blogId", b."name" as "blogName", p."createdAt", 
        p."ownerId", ub."isBanned" as "ownerIsBanned", p."likesCount", 
        p."dislikesCount", b."isBanned" as "parentBlogIsBanned"
        FROM "POSTS" as p
        JOIN "BLOGS" as b
        ON p."blogId" = b."id"
        JOIN "USERS_GLOBAL_BAN" as ub
        ON p."ownerId" = ub."userId"
        WHERE b."id" = $1 AND ub."isBanned" = false AND b."isBanned" = false
        ${pickOrderForPostsQuery(q.sortBy, q.sortDirection)}
        LIMIT $2 OFFSET $3
        `,
        [blogId, q.pageSize, offsetSize],
      );
      if (reqPageDbPosts.length === 0) return null;
      else {
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
    } else throw new NotFoundException();
  }
  async getUserLikeForPost(
    userId: string,
    postId: string,
  ): Promise<PostLikeJoinedType> {
    const foundLikeResult: PostLikeJoinedType[] = await this.dataSource.query(
      `
      SELECT lp."id", lp."postId", lp."userId", u."login" as "userLogin",
      lp."addedAt", lp."likeStatus"
      FROM "LIKES_FOR_POSTS" AS lp
      LEFT JOIN "USERS" AS u
      ON lp."userId" = u."id"
      LEFT JOIN "USERS_GLOBAL_BAN" AS ub
      ON lp."userId" = ub."userId"
      WHERE lp."postId" = $1 AND lp."userId" = $2 AND ub."isBanned" = false
      `,
      [postId, userId],
    );
    return foundLikeResult[0];
  }
  private async _getNewestLikes(
    postId: string,
  ): Promise<Array<PostLikeJoinedType>> {
    return await this.dataSource.query(
      `
      SELECT lp."id", lp."postId", lp."userId", u."login" as "userLogin",
      lp."addedAt", lp."likeStatus"
      FROM "LIKES_FOR_POSTS" AS lp
      LEFT JOIN "USERS" AS u
      ON lp."userId" = u."id"
      LEFT JOIN "USERS_GLOBAL_BAN" AS ub
      ON lp."userId" = ub."userId"
      WHERE (lp."postId" = $1 AND lp."likeStatus" = $2) AND ub."isBanned" = false
      ORDER BY lp."addedAt" DESC
      LIMIT 3 OFFSET 0
      `,
      [postId, LikeStatus.like],
    );
  }
  async _mapPostToViewType(
    post: PostJoinedType,
    activeUserId: string,
  ): Promise<PostViewModelType> {
    if (activeUserId === '')
      activeUserId = '3465cc2e-f49b-11ed-a05b-0242ac120003';
    const userLike = await this.getUserLikeForPost(activeUserId, post.id);
    const newestLikes = await this._getNewestLikes(post.id);
    const mappedLikes = newestLikes.map((e) => {
      return {
        addedAt: new Date(e.addedAt).toISOString(),
        userId: e.userId,
        login: e.userLogin,
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
