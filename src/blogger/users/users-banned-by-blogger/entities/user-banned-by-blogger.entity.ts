import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Blog } from '../../../../blogs/entities/blog.entity';
import { User } from '../../../../users/etities/user.entity';

@Entity()
export class UserBannedByBlogger {
  @ManyToOne(() => Blog, (b) => b.userBans, { onDelete: 'CASCADE' })
  @JoinColumn()
  blog: Blog;
  @PrimaryColumn('uuid')
  blogId: string;
  @ManyToOne(() => User, (u) => u.userBlogBans, { onDelete: 'CASCADE' })
  @JoinColumn()
  bannedUser: User;
  @PrimaryColumn('uuid')
  bannedUserId: string;
  @Column('text')
  banReason: string;
  @Column('timestamp')
  banDate: Date;
  static instantiate(blogId: string, bannedUserId: string, banReason: string) {
    const userBan = new UserBannedByBlogger();
    userBan.blogId = blogId;
    userBan.bannedUserId = bannedUserId;
    userBan.banReason = banReason;
    userBan.banDate = new Date();
    return userBan;
  }
}
