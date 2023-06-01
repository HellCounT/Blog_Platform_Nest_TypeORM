import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../../../users/etities/user.entity';

@Entity()
export class Device {
  @PrimaryColumn('uuid')
  id: string;
  @ManyToOne(() => User, (u) => u.devices, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
  @Column('uuid')
  userId: string;
  @Column('varchar')
  ip: string;
  @Column('varchar')
  deviceName: string;
  @Column('timestamp')
  issuedAt: Date;
  @Column('timestamp')
  expirationDate: Date;
  @Column('varchar')
  refreshTokenMeta: string;
}
