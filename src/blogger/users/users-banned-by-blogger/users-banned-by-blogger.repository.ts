import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserBannedByBlogger } from './entities/user-banned-by-blogger.entity';
import { isVoid } from '../../../application-helpers/void.check.helper';

@Injectable()
export class UsersBannedByBloggerRepository {
  constructor(
    @InjectRepository(UserBannedByBlogger)
    protected userBannedByBloggerRepo: Repository<UserBannedByBlogger>,
  ) {}
  async findUserBan(
    blogId: string,
    bannedUserId: string,
  ): Promise<UserBannedByBlogger> {
    try {
      const findUserBanResult = await this.userBannedByBloggerRepo.findOneBy({
        blogId: blogId,
        bannedUserId: bannedUserId,
      });
      if (isVoid(findUserBanResult)) return null;
      return findUserBanResult;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
  async banUser(
    blogId: string,
    bannedUserId: string,
    banReason: string,
  ): Promise<void> {
    try {
      const newUserBan = UserBannedByBlogger.instantiate(
        blogId,
        bannedUserId,
        banReason,
      );
      await this.userBannedByBloggerRepo.save(newUserBan);
      return;
    } catch (e) {
      console.log(e);
      return;
    }
  }
  async unbanUser(blogId: string, bannedUserId: string): Promise<boolean> {
    try {
      const result = await this.userBannedByBloggerRepo.delete({
        blogId: blogId,
        bannedUserId: bannedUserId,
      });
      return result.affected > 0;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
}
