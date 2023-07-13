import { Injectable } from '@nestjs/common';
import { QueryParserType } from '../../base/application-helpers/query-parser-type';
import { OutputSuperAdminBlogDto } from './dto/output.super-admin.blog.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Blog } from '../../blogs/entities/blog.entity';
import { PaginatorType } from '../../base/application-helpers/paginator.type';

@Injectable()
export class SuperAdminBlogsQuery {
  constructor(@InjectRepository(Blog) protected blogsRepo: Repository<Blog>) {}
  async viewAllBlogs(
    q: QueryParserType,
  ): Promise<PaginatorType<OutputSuperAdminBlogDto>> {
    const offsetSize = (q.pageNumber - 1) * q.pageSize;
    const [reqPageDbBlogs, allBlogsCount] = await this.blogsRepo.findAndCount({
      where: {
        name: ILike('%' + q.searchNameTerm + '%'),
      },
      order: { [q.sortBy]: q.sortDirection },
      take: q.pageSize,
      skip: offsetSize,
      relations: {
        owner: true,
      },
    });
    const items = reqPageDbBlogs.map((b) =>
      this._mapBlogToSuperAdminViewType(b),
    );
    return {
      pagesCount: Math.ceil(allBlogsCount / q.pageSize),
      page: q.pageNumber,
      pageSize: q.pageSize,
      totalCount: allBlogsCount,
      items: items,
    };
  }
  private _mapBlogToSuperAdminViewType(blog: Blog): OutputSuperAdminBlogDto {
    let banDateString;
    if (blog.banDate === null) banDateString = null;
    else banDateString = blog.banDate.toISOString();
    return {
      id: blog.id,
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt,
      isMembership: blog.isMembership,
      blogOwnerInfo: {
        userId: blog.ownerId,
        userLogin: blog.owner.login,
      },
      banInfo: {
        isBanned: blog.isBanned,
        banDate: banDateString,
      },
    };
  }
}
