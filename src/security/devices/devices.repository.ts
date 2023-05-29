import { Injectable } from '@nestjs/common';
import { DeviceData } from './types/devices.types';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from './entities/device.entity';
import { isVoid } from '../../application-helpers/void.check.helper';

@Injectable()
export class DevicesRepository {
  constructor(
    @InjectRepository(Device) protected devicesRepo: Repository<Device>,
  ) {}
  async findSessionByDeviceId(deviceId: string): Promise<DeviceData> {
    try {
      const device = await this.devicesRepo.findOneBy({ id: deviceId });
      if (isVoid(device)) return null;
      return device;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
  async getAllSessionsForUser(userId: string): Promise<DeviceData[]> {
    try {
      return this.devicesRepo.findBy({ userId: userId });
    } catch (e) {
      console.log(e);
      return null;
    }
  }
  async addSessionToDb(newSession: DeviceData): Promise<void> {
    const device = new Device();
    device.id = newSession.id;
    device.userId = newSession.userId;
    device.ip = newSession.ip;
    device.deviceName = newSession.deviceName;
    device.issuedAt = newSession.issuedAt;
    device.expirationDate = newSession.expirationDate;
    device.refreshTokenMeta = newSession.refreshTokenMeta;
    await this.devicesRepo.save(device);
    return;
  }
  async updateSessionWithDeviceId(
    newRefreshTokenMeta: string,
    deviceId: string,
    issueDate: Date,
    expDate: Date,
  ): Promise<boolean> {
    try {
      const activeSession = await this.findSessionByDeviceId(deviceId);
      if (activeSession) {
        await this.devicesRepo.update(deviceId, {
          issuedAt: issueDate,
          expirationDate: expDate,
          refreshTokenMeta: newRefreshTokenMeta,
        });
        return true;
      } else return false;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
  async deleteSessionById(deviceId: string): Promise<boolean> {
    try {
      const activeSession = await this.findSessionByDeviceId(deviceId);
      if (activeSession) {
        await this.devicesRepo.delete(deviceId);
        return true;
      } else return false;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
  async deleteAllOtherSessions(
    userId: string,
    deviceId: string,
  ): Promise<void> {
    await this.devicesRepo
      .createQueryBuilder()
      .delete()
      .from(Device)
      .where(`userId = :userId AND deviceId != :deviceId`, {
        userId: userId,
        deviceId: deviceId,
      })
      .execute();
    return;
  }
  async killAllSessionsForUser(userId: string): Promise<void> {
    await this.devicesRepo.delete({ userId: userId });
    return;
  }
}
