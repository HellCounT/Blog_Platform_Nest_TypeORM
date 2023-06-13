import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Post } from '../../posts/entities/post.entity';
import { User } from '../../users/entities/user.entity';
import { LikeStatus } from '../types/likes.types';

@Entity()
export class PostLike {
  @PrimaryColumn('uuid')
  id: string;
  @ManyToOne(() => Post, (p) => p.likes, { onDelete: 'CASCADE' })
  @JoinColumn()
  post: Post;
  @Column('uuid')
  postId: string;
  @ManyToOne(() => User, (u) => u.postLikes, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
  @Column('uuid')
  userId: string;
  @Column('timestamp')
  addedAt: Date;
  @Column('varchar')
  likeStatus: LikeStatus;
  static instantiate(
    postLikeId: string,
    postId: string,
    userId: string,
    likeStatus: LikeStatus,
  ) {
    const postLike = new PostLike();
    postLike.id = postLikeId;
    postLike.postId = postId;
    postLike.userId = userId;
    postLike.addedAt = new Date();
    postLike.likeStatus = likeStatus;
    return postLike;
  }
}
