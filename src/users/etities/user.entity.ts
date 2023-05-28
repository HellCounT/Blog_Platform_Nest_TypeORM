import { Column, Entity, OneToMany, OneToOne, PrimaryColumn } from 'typeorm';
import { UserGlobalBan } from './user-global-ban.entity';
import { UserConfirmation } from './user-confirmation.entity';
import { UserRecovery } from './user-recovery.entity';
import { Device } from '../../security/devices/entities/device.entity';
import { ExpiredToken } from '../../security/tokens/entities/expired-token.entity';

@Entity()
export class User {
  @PrimaryColumn('uuid')
  id: string;
  @Column('varchar')
  login: string;
  @Column('varchar')
  email: string;
  @Column('varchar')
  createdAt: string;
  @Column('varchar')
  hash: string;
  @OneToOne(() => UserGlobalBan, (ub) => ub.user)
  userGlobalBan: UserGlobalBan;
  @OneToOne(() => UserConfirmation, (uc) => uc.user)
  userConfirmation: UserConfirmation;
  @OneToOne(() => UserRecovery, (ur) => ur.user)
  userRecovery: UserRecovery;
  @OneToMany(() => Device, (d) => d.user)
  devices: Device[];
  @OneToMany(() => ExpiredToken, (ep) => ep.user)
  expiredTokens: ExpiredToken[];
}
