import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../../users/etities/user.entity';
import { Post } from '../../posts/entities/post.entity';

@Entity()
export class Blog {
  @PrimaryColumn('uuid')
  id: string;
  @Column('varchar')
  name: string;
  @Column('varchar')
  description: string;
  @Column('varchar')
  websiteUrl: string;
  @Column('varchar')
  createdAt: string;
  @Column('boolean')
  isMembership: string;
  @ManyToOne(() => User, (u) => u.blogs)
  @JoinColumn()
  owner: User;
  @Column('uuid')
  ownerId: string;
  @Column('boolean')
  isBanned: boolean;
  @Column('timestamp', { nullable: true })
  banDate: Date | null;
  @OneToMany(() => Post, (p) => p.blog)
  posts: Post[];
}
