import { Injectable } from '@nestjs/common';
import { UserQueryType } from './types/users.types';
import { OutputDeviceDto } from '../security/devices/dto/output.device.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { isVoid } from '../application-helpers/void.check.helper';
import { Device } from '../security/devices/entities/device.entity';

@Injectable()
export class UsersQuery {
  constructor(
    @InjectRepository(User) protected usersRepo: Repository<User>,
    @InjectRepository(Device) protected devicesRepo: Repository<Device>,
  ) {}
  async findUserById(userId: string): Promise<UserQueryType> {
    try {
      const user = await this.usersRepo.findOneBy({ id: userId });
      if (isVoid(user)) return null;
      return { id: user.id, login: user.login, email: user.email };
    } catch (e) {
      console.log(e);
      return null;
    }
  }
  async getAllSessionsForCurrentUser(
    userId: string,
  ): Promise<Array<OutputDeviceDto>> {
    const sessions = await this.devicesRepo.findBy({
      userId: userId,
    });
    return sessions.map((e) => this._mapDevicesToViewType(e));
  }
  private _mapDevicesToViewType(device: Device): OutputDeviceDto {
    return {
      deviceId: device.id,
      ip: device.ip,
      title: device.deviceName,
      lastActiveDate: device.issuedAt.toISOString(),
    };
  }
}
