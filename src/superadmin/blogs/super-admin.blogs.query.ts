import { Injectable } from '@nestjs/common';
import { QueryParser } from '../../application-helpers/query.parser';
import { BlogSAPaginatorType } from './types/super-admin.blogs.types';
import { OutputSuperAdminBlogDto } from './dto/output.super-admin.blog.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blog } from '../../blogs/entities/blog.entity';
import { User } from '../../users/etities/user.entity';
import { isVoid } from '../../application-helpers/void.check.helper';

@Injectable()
export class SuperAdminBlogsQuery {
  constructor(
    @InjectRepository(Blog) protected blogsRepo: Repository<Blog>,
    @InjectRepository(User) protected usersRepo: Repository<User>,
  ) {}
  async viewAllBlogs(q: QueryParser): Promise<BlogSAPaginatorType> {
    const offsetSize = (q.pageNumber - 1) * q.pageSize;
    const [reqPageDbBlogs, allBlogsCount] = await this.blogsRepo
      .createQueryBuilder('b')
      .select()
      .leftJoinAndSelect('b.owner', 'u')
      .where(`b."name" ILIKE '%' || COALESCE(:searchNameTerm, '') || '%'`, {
        searchNameTerm: q.searchNameTerm,
      })
      .orderBy(`"${q.sortBy}"`, q.sortDirection)
      .limit(q.pageSize)
      .offset(offsetSize)
      .getManyAndCount();
    const items = [];
    for await (const b of reqPageDbBlogs) {
      const blog = await this._mapBlogToSuperAdminViewType(b);
      items.push(blog);
    }
    return {
      pagesCount: Math.ceil(allBlogsCount / q.pageSize),
      page: q.pageNumber,
      pageSize: q.pageSize,
      totalCount: allBlogsCount,
      items: items,
    };
  }
  private async _mapBlogToSuperAdminViewType(
    blog: Blog,
  ): Promise<OutputSuperAdminBlogDto> {
    const owner = await this.usersRepo.findOneBy({ id: blog.ownerId });
    let ownerLogin;
    if (isVoid(blog.ownerId)) ownerLogin = null;
    else ownerLogin = owner.login;
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
        userLogin: ownerLogin,
      },
      banInfo: {
        isBanned: blog.isBanned,
        banDate: banDateString,
      },
    };
  }
}
