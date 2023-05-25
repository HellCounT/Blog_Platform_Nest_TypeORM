import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class UserConfirmation {
  @PrimaryColumn('uuid')
  userId: string;
  @Column('varchar')
  confirmationCode: string;
  @Column('varchar')
  confirmationExpirationDate: string;
  @Column('boolean')
  isConfirmed: boolean;
}
