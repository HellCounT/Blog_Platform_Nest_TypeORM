import {
  getBanStatusForQuery,
  UserQueryParser,
} from '../../application-helpers/query.parser';
import { UserPaginatorType } from '../../users/types/users.types';
import { OutputSuperAdminUserDto } from './dto/output.super-admin.user.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/etities/user.entity';
import { UserGlobalBan } from '../../users/etities/user-global-ban.entity';
import { UserConfirmation } from '../../users/etities/user-confirmation.entity';
import { UserRecovery } from '../../users/etities/user-recovery.entity';

@Injectable()
export class SuperAdminUsersQuery {
  constructor(
    @InjectRepository(User) protected usersRepo: Repository<User>,
    @InjectRepository(UserGlobalBan)
    protected usersBansRepo: Repository<UserGlobalBan>,
    @InjectRepository(UserConfirmation)
    protected usersConfirmationsRepo: Repository<UserConfirmation>,
    @InjectRepository(UserRecovery)
    protected usersRecoveryRepo: Repository<UserRecovery>,
  ) {}
  async viewAllUsers(q: UserQueryParser): Promise<UserPaginatorType> {
    const offsetSize = (q.pageNumber - 1) * q.pageSize;
    const [reqPageUsers, allUsersCount] = await this.usersRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.userGlobalBan', 'b')
      .where(
        `${getBanStatusForQuery(q.banStatus)} (
        u."login" ILIKE '%' || COALESCE(:searchLoginTerm, '') || '%'
        OR
        u."email" ILIKE '%' || COALESCE(:searchEmailTerm, '') || '%')`,
        {
          searchLoginTerm: q.searchLoginTerm,
          searchEmailTerm: q.searchEmailTerm,
        },
      )
      .orderBy(`"${q.sortBy}"`, q.sortDirection)
      .limit(q.pageSize)
      .offset(offsetSize)
      .getManyAndCount();
    const items = [];
    for await (const u of reqPageUsers) {
      const user = await this._mapUserToSAViewType(u);
      items.push(user);
    }
    return {
      pagesCount: Math.ceil(allUsersCount / q.pageSize),
      page: q.pageNumber,
      pageSize: q.pageSize,
      totalCount: allUsersCount,
      items: items,
    };
  }
  private async _mapUserToSAViewType(
    user: User,
  ): Promise<OutputSuperAdminUserDto> {
    const userBanInfo = await this.usersBansRepo.findOneBy({ userId: user.id });
    let banDateString;
    if (userBanInfo.banDate === null) banDateString = null;
    else banDateString = userBanInfo.banDate.toISOString();
    return {
      id: user.id,
      login: user.login,
      email: user.email,
      createdAt: user.createdAt,
      banInfo: {
        isBanned: userBanInfo.isBanned,
        banDate: banDateString,
        banReason: userBanInfo.banReason,
      },
    };
  }
}
