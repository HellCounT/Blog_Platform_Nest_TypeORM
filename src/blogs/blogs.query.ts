import {
  pickOrderForBlogsQuery,
  QueryParser,
} from '../application-helpers/query.parser';
import {
  Blog,
  BlogPaginatorType,
  BlogViewModelType,
} from './types/blogs.types';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class BlogsQuery {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}
  async viewAllBlogs(q: QueryParser): Promise<BlogPaginatorType> {
    const allBlogsCountResult = await this.dataSource.query(
      `
      SELECT COUNT(*)
      FROM "BLOGS" AS b
      JOIN "USERS_GLOBAL_BAN" AS ub
      ON b."ownerId" = ub."userId"
      WHERE (b."isBanned" = false AND ub."isBanned" = false)
      AND "name" ILIKE '%' || COALESCE($1, '') || '%'
      `,
      [q.searchNameTerm],
    );
    const allBlogsCount: number = parseInt(allBlogsCountResult[0].count, 10);
    const offsetSize = (q.pageNumber - 1) * q.pageSize;
    const reqPageDbBlogs: Blog[] = await this.dataSource.query(
      `
      SELECT b."id", b."name", b."description", b."websiteUrl", b."createdAt",
      b."isMembership", b."ownerId", b."isBanned", b."banDate"
      FROM "BLOGS" AS b
      JOIN "USERS_GLOBAL_BAN" AS ub
      ON b."ownerId" = ub."userId"
      WHERE (b."isBanned" = false AND ub."isBanned" = false)
      AND "name" ILIKE '%' || COALESCE($1, '') || '%'
      ${pickOrderForBlogsQuery(q.sortBy, q.sortDirection)}
      LIMIT $2 OFFSET $3
      `,
      [q.searchNameTerm, q.pageSize, offsetSize],
    );
    const pageBlogs = reqPageDbBlogs.map((b) => this._mapBlogToViewType(b));
    return {
      pagesCount: Math.ceil(allBlogsCount / q.pageSize),
      page: q.pageNumber,
      pageSize: q.pageSize,
      totalCount: allBlogsCount,
      items: pageBlogs,
    };
  }
  async findBlogById(blogId: string): Promise<BlogViewModelType> {
    const foundBlogResult: Blog[] = await this.dataSource.query(
      `
      SELECT * FROM "BLOGS"
      WHERE "id" = $1 AND "isBanned" = false
      `,
      [blogId],
    );
    if (foundBlogResult.length === 1)
      return this._mapBlogToViewType(foundBlogResult[0]);
    else throw new NotFoundException();
  }
  _mapBlogToViewType(blog: Blog): BlogViewModelType {
    return {
      id: blog.id,
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt,
      isMembership: blog.isMembership,
    };
  }
}
