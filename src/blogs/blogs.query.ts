import { QueryParserType } from '../base/application-helpers/query-parser-type';
import { BlogViewModelType } from './types/blogs.types';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Blog } from './entities/blog.entity';
import { PaginatorType } from '../base/application-helpers/paginator.type';

@Injectable()
export class BlogsQuery {
  constructor(@InjectRepository(Blog) protected blogsRepo: Repository<Blog>) {}
  async viewAllBlogs(
    q: QueryParserType,
  ): Promise<PaginatorType<BlogViewModelType>> {
    const offsetSize = (q.pageNumber - 1) * q.pageSize;
    const [reqPageDbBlogs, allBlogsCount] = await this.blogsRepo.findAndCount({
      where: {
        name: ILike('%' + q.searchNameTerm + '%'),
        isBanned: false,
        owner: {
          userGlobalBan: {
            isBanned: false,
          },
        },
      },
      order: { [q.sortBy]: q.sortDirection },
      take: q.pageSize,
      skip: offsetSize,
      relations: {
        owner: {
          userGlobalBan: true,
        },
      },
    });
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
    if (foundBlog) return this._mapBlogToViewType(foundBlog);
    else throw new NotFoundException();
  }
  //todo: async mapping (adding images)
  async _mapBlogToViewType(blog: Blog): BlogViewModelType {
    return await {
      id: blog.id,
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt,
      isMembership: blog.isMembership,
    };
  }
}
