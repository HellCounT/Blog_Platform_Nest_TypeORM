import { QueryParser } from '../application-helpers/query.parser';
import { BlogViewModelType } from './types/blogs.types';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Blog } from './entities/blog.entity';
import { PaginatorType } from '../application-helpers/paginator.type';

@Injectable()
export class BlogsQuery {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Blog) protected blogsRepo: Repository<Blog>,
  ) {}
  async viewAllBlogs(
    q: QueryParser,
  ): Promise<PaginatorType<BlogViewModelType>> {
    const offsetSize = (q.pageNumber - 1) * q.pageSize;
    const [reqPageDbBlogs, allBlogsCount] = await this.blogsRepo
      .createQueryBuilder('b')
      .select()
      .leftJoin('b.owner', 'u')
      .leftJoin('u.userGlobalBan', 'ub')
      .where(`b."isBanned" = false`)
      .andWhere(`ub."isBanned" = false`)
      .andWhere(
        `
      "name" ILIKE '%' || COALESCE(:searchNameTerm, '') || '%'
      `,
        { searchNameTerm: q.searchNameTerm },
      )
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
  async findBlogById(blogId: string): Promise<BlogViewModelType> {
    const foundBlog = await this.blogsRepo.findOneBy({
      id: blogId,
      isBanned: false,
    });
    if (!foundBlog) return this._mapBlogToViewType(foundBlog);
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
