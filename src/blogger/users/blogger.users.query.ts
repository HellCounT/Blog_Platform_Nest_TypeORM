import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginatorType } from '../../application-helpers/paginator.type';
import { OutputBannedUserByBloggerDto } from './dto/output.user-banned-by-blogger.dto';
import { UserQueryParser } from '../../application-helpers/query.parser';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Blog } from '../../blogs/entities/blog.entity';
import { UserBannedByBlogger } from './users-banned-by-blogger/entities/user-banned-by-blogger.entity';
import { emptyPaginatorStab } from '../../application-helpers/empty.paginator.stab';

@Injectable()
export class BloggerUsersQuery {
  constructor(
    @InjectRepository(User) protected usersRepo: Repository<User>,
    @InjectRepository(Blog) protected blogsRepo: Repository<Blog>,
    @InjectRepository(UserBannedByBlogger)
    protected bansByBloggersRepo: Repository<UserBannedByBlogger>,
  ) {}
  async getAllBannedUsersForBlog(
    blogId: string,
    userId: string,
    q: UserQueryParser,
  ): Promise<PaginatorType<OutputBannedUserByBloggerDto>> {
    const offsetSize = (q.pageNumber - 1) * q.pageSize;
    const foundBlog = await this.blogsRepo.findOneBy({ id: blogId });
    if (!foundBlog) throw new NotFoundException();
    if (foundBlog.ownerId !== userId) throw new ForbiddenException();
    // const [reqPageDbBans, bansCount] =
    // await this.bansByBloggersRepo.findAndCount({
    //   where: {
    //     blogId: blogId,
    //     bannedUser: {
    //       login: ILike('%' + q.searchLoginTerm + '%'),
    //     },
    //   },
    //   order: { [q.sortBy]: q.sortDirection },
    //   take: q.pageSize,
    //   skip: offsetSize,
    //   relations: {
    //     bannedUser: true,
    //   },
    // });
    const [reqPageDbBans, bansCount] = await this.bansByBloggersRepo
      .createQueryBuilder('bu')
      .select()
      .leftJoinAndSelect(User, 'u', `bu."bannedUserId" = u.id`)
      .where('bu."blogId" = :blogId', { blogId: blogId })
      .andWhere(
        `u."login" ILIKE '%' || COALESCE(:searchLoginTerm, '') || '%'`,
        { searchLoginTerm: q.searchLoginTerm },
      )
      .orderBy(`"${q.sortBy}"`, q.sortDirection)
      .limit(q.pageSize)
      .offset(offsetSize)
      .getManyAndCount();
    if (bansCount === 0) return emptyPaginatorStab;
    const items = [];
    for await (const b of reqPageDbBans) {
      const item = await this._mapBanToBannedUserViewType(b);
      items.push(item);
    }
    return {
      pagesCount: Math.ceil(bansCount / q.pageSize),
      page: q.pageNumber,
      pageSize: q.pageSize,
      totalCount: bansCount,
      items: items,
    };
  }
  private async _mapBanToBannedUserViewType(
    bannedUserByBloggerInfo: UserBannedByBlogger,
  ): Promise<OutputBannedUserByBloggerDto> {
    const user = await this.usersRepo.findOneBy({
      id: bannedUserByBloggerInfo.bannedUserId,
    });
    return {
      id: bannedUserByBloggerInfo.bannedUserId,
      login: user.login,
      banInfo: {
        isBanned: true,
        banDate: bannedUserByBloggerInfo.banDate.toISOString(),
        banReason: bannedUserByBloggerInfo.banReason,
      },
    };
  }
}
