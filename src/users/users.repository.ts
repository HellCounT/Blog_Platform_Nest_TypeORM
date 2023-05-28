import { Injectable } from '@nestjs/common';
import { UserCollectedData } from './types/users.types';
import { OutputSuperAdminUserDto } from '../superadmin/users/dto/output.super-admin.user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './etities/user.entity';
import { UserGlobalBan } from './etities/user-global-ban.entity';
import { UserConfirmation } from './etities/user-confirmation.entity';
import { UserRecovery } from './etities/user-recovery.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User) protected usersRepo: Repository<User>,
    @InjectRepository(UserGlobalBan)
    protected usersBansRepo: Repository<UserGlobalBan>,
    @InjectRepository(UserConfirmation)
    protected usersConfirmationsRepo: Repository<UserConfirmation>,
    @InjectRepository(UserRecovery)
    protected usersRecoveryRepo: Repository<UserRecovery>,
  ) {}
  async getUserById(id: string): Promise<UserCollectedData> {
    try {
      const user = await this.usersRepo.findOneBy({ id: id });
      if (!user) return null;
      const userBanData = await this.usersBansRepo.findOneBy({ userId: id });
      const userConfirmationData = await this.usersConfirmationsRepo.findOneBy({
        userId: id,
      });
      const userRecoveryData = await this.usersRecoveryRepo.findOneBy({
        userId: id,
      });
      return this._mapUserSqlJoinedTypeToUserType(
        user,
        userConfirmationData,
        userRecoveryData,
        userBanData,
      );
    } catch (e) {
      console.log(e);
      return null;
    }
  }
  async createUser(
    newUser: UserCollectedData,
  ): Promise<OutputSuperAdminUserDto> {
    const user = new User();
    user.id = newUser.id;
    user.login = newUser.accountData.login;
    user.createdAt = newUser.accountData.createdAt;
    user.hash = newUser.accountData.hash;
    await this.usersRepo.save(user);
    const userBanData = new UserGlobalBan();
    userBanData.userId = user.id;
    userBanData.isBanned = newUser.globalBanInfo.isBanned;
    userBanData.banReason = newUser.globalBanInfo.banReason;
    userBanData.banDate = newUser.globalBanInfo.banDate;
    await this.usersBansRepo.save(userBanData);
    const userConfirmationData = new UserConfirmation();
    userConfirmationData.userId = user.id;
    userConfirmationData.confirmationCode =
      newUser.emailConfirmationData.confirmationCode;
    userConfirmationData.confirmationExpirationDate =
      newUser.emailConfirmationData.expirationDate;
    userConfirmationData.isConfirmed =
      newUser.emailConfirmationData.isConfirmed;
    await this.usersConfirmationsRepo.save(userConfirmationData);
    const userRecoveryData = new UserRecovery();
    userRecoveryData.userId = user.id;
    userRecoveryData.recoveryCode = newUser.recoveryCodeData.recoveryCode;
    userRecoveryData.recoveryExpirationDate =
      newUser.recoveryCodeData.expirationDate;
    await this.usersRecoveryRepo.save(userRecoveryData);
    const createdUser = await this.getUserById(newUser.id);
    return {
      id: createdUser.id,
      login: createdUser.accountData.login,
      email: createdUser.accountData.email,
      createdAt: createdUser.accountData.createdAt,
      banInfo: {
        isBanned: createdUser.globalBanInfo.isBanned,
        banDate: null,
        banReason: createdUser.globalBanInfo.banReason,
      },
    };
  }
  catch(e) {
    console.log(e);
    return null;
  }
  async deleteUser(id: string): Promise<boolean> {
    try {
      const result = await this.usersRepo.delete(id);
      return result.affected === 1;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
  async findByLoginOrEmail(loginOrEmail: string): Promise<UserCollectedData> {
    try {
      const user = await this.usersRepo.findOne({
        where: [{ login: loginOrEmail }, { email: loginOrEmail }],
      });
      if (!user) return null;
      return await this.getUserById(user.id);
    } catch (e) {
      console.log(e);
      return;
    }
  }
  async findByConfirmationCode(
    emailConfirmationCode: string,
  ): Promise<UserCollectedData> {
    try {
      const result = await this.usersConfirmationsRepo.findOneBy({
        confirmationCode: emailConfirmationCode,
      });
      if (!result) return null;
      const foundUser = this.getUserById(result.userId);
      if (!foundUser) return null;
      return foundUser;
    } catch (e) {
      console.log(e);
      return;
    }
  }
  async findByRecoveryCode(recoveryCode: string): Promise<UserCollectedData> {
    try {
      const result = await this.usersRecoveryRepo.findOneBy({
        recoveryCode: recoveryCode,
      });
      if (!result) return null;
      const foundUser = this.getUserById(result.userId);
      if (!foundUser) return null;
      return foundUser;
    } catch (e) {
      console.log(e);
      return;
    }
  }
  async confirmationSetUser(userId: string): Promise<boolean> {
    try {
      await this.usersConfirmationsRepo.update(
        { userId: userId },
        { isConfirmed: true },
      );
      return true;
    } catch (e) {
      return false;
    }
  }
  async updateConfirmationCode(userId: string, newCode: string): Promise<void> {
    try {
      await this.usersConfirmationsRepo.update(
        { userId: userId },
        {
          confirmationCode: newCode,
        },
      );
      return;
    } catch (e) {
      return;
    }
  }
  async updateRecoveryCode(
    userId: string,
    newRecoveryCode: string,
  ): Promise<void> {
    try {
      await this.usersRecoveryRepo.update(
        { userId: userId },
        {
          recoveryCode: newRecoveryCode,
        },
      );
      return;
    } catch (e) {
      return;
    }
  }
  async updateHashByRecoveryCode(id: string, newHash: string): Promise<void> {
    try {
      await this.usersRepo.update(id, {
        hash: newHash,
      });
      return;
    } catch (e) {
      return;
    }
  }
  async banUserById(
    userId: string,
    isBanned: boolean,
    banReason: string,
  ): Promise<void> {
    if (isBanned) {
      await this.usersBansRepo.update(
        { userId: userId },
        {
          isBanned: isBanned,
          banDate: new Date(),
          banReason: banReason,
        },
      );
    } else {
      await this.usersBansRepo.update(
        { userId: userId },
        {
          isBanned: isBanned,
          banDate: null,
          banReason: null,
        },
      );
    }
    return;
  }
  private _mapUserSqlJoinedTypeToUserType(
    user: User,
    userConfirmationData: UserConfirmation,
    userRecoveryData: UserRecovery,
    userBanData: UserGlobalBan,
  ): UserCollectedData {
    return {
      id: user.id,
      accountData: {
        login: user.login,
        email: user.email,
        hash: user.hash,
        createdAt: user.createdAt,
      },
      emailConfirmationData: {
        confirmationCode: userConfirmationData.confirmationCode,
        expirationDate: userConfirmationData.confirmationExpirationDate,
        isConfirmed: userConfirmationData.isConfirmed,
      },
      recoveryCodeData: {
        recoveryCode: userRecoveryData.recoveryCode,
        expirationDate: userRecoveryData.recoveryExpirationDate,
      },
      globalBanInfo: {
        isBanned: userBanData.isBanned,
        banDate: userBanData.banDate,
        banReason: userBanData.banReason,
      },
    };
  }
}
