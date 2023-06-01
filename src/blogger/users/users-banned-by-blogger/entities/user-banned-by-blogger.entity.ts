import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Blog } from '../../../../blogs/entities/blog.entity';
import { User } from '../../../../users/etities/user.entity';

@Entity()
export class UserBannedByBlogger {
  @ManyToOne(() => Blog, (b) => b.userBans)
  @JoinColumn()
  blog: Blog;
  @PrimaryColumn('uuid')
  blogId: string;
  @ManyToOne(() => User, (u) => u.userBlogBans)
  @JoinColumn()
  bannedUser: User;
  @PrimaryColumn('uuid')
  bannedUserId: string;
  @Column('text')
  banReason: string;
  @Column('timestamp')
  banDate: Date;
}
