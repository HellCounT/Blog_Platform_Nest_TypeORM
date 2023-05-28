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
import { UserGlobalBan } from '../users/etities/user-global-ban.entity';
import { User } from '../users/etities/user.entity';
import { UserConfirmation } from '../users/etities/user-confirmation.entity';
import { UserRecovery } from '../users/etities/user-recovery.entity';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([
      User,
      UserGlobalBan,
      UserConfirmation,
      UserRecovery,
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
