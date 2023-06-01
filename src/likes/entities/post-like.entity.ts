import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Post } from '../../posts/entities/post.entity';
import { User } from '../../users/etities/user.entity';
import { LikeStatus } from '../types/likes.types';

@Entity()
export class PostLike {
  @PrimaryColumn('uuid')
  id: string;
  @ManyToOne(() => Post, (p) => p.likes)
  @JoinColumn()
  post: Post;
  @Column('uuid')
  postId: string;
  @ManyToOne(() => User, (u) => u.postLikes)
  @JoinColumn()
  user: User;
  @Column('uuid')
  userId: string;
  @Column('timestamp')
  addedAt: Date;
  @Column('varchar')
  likeStatus: LikeStatus;
}
