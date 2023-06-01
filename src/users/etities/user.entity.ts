import { Column, Entity, OneToMany, OneToOne, PrimaryColumn } from 'typeorm';
import { UserGlobalBan } from './user-global-ban.entity';
import { UserConfirmation } from './user-confirmation.entity';
import { UserRecovery } from './user-recovery.entity';
import { Device } from '../../security/devices/entities/device.entity';
import { ExpiredToken } from '../../security/tokens/entities/expired-token.entity';
import { Blog } from '../../blogs/entities/blog.entity';
import { Post } from '../../posts/entities/post.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { CommentLike } from '../../likes/entities/comment-like.entity';
import { PostLike } from '../../likes/entities/post-like.entity';

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
  @OneToMany(() => Blog, (b) => b.owner)
  blogs: Blog[];
  @OneToMany(() => Post, (p) => p.owner)
  posts: Post[];
  @OneToMany(() => Comment, (c) => c.user)
  comments: Comment[];
  @OneToMany(() => CommentLike, (cl) => cl.user)
  commentLikes: CommentLike[];
  @OneToMany(() => PostLike, (pl) => pl.user)
  postLikes: PostLike[];
}
