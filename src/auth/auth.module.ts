import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAdapter } from './jwt.adapter';
import { UsersRepository } from '../users/users.repository';
import { EmailManager } from '../email/email-manager';
import { ConfigService } from '@nestjs/config';
import { BasicStrategy } from './strategies/basic.strategy';
import { EmailService } from '../email/email.service';
import { UsersQuery } from '../users/users.query';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserGlobalBan } from '../users/entities/user-global-ban.entity';
import { User } from '../users/entities/user.entity';
import { UserConfirmation } from '../users/entities/user-confirmation.entity';
import { UserRecovery } from '../users/entities/user-recovery.entity';
import { Device } from '../security/devices/entities/device.entity';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([
      User,
      UserGlobalBan,
      UserConfirmation,
      UserRecovery,
      Device,
    ]),
  ],
  providers: [
    LocalStrategy,
    JwtStrategy,
    BasicStrategy,
    JwtAdapter,
    UsersRepository,
    UsersQuery,
    EmailManager,
    EmailService,
    ConfigService,
  ],
})
export class AuthModule {}
