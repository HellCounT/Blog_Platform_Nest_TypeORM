import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Comment } from '../../comments/entities/comment.entity';
import { User } from '../../users/etities/user.entity';
import { LikeStatus } from '../types/likes.types';

@Entity()
export class CommentLike {
  @PrimaryColumn('uuid')
  id: string;
  @ManyToOne(() => Comment, (c) => c.likes)
  @JoinColumn()
  comment: Comment;
  @Column('uuid')
  commentId: string;
  @ManyToOne(() => User, (u) => u.commentLikes)
  @JoinColumn()
  user: User;
  @Column('uuid')
  userId: string;
  @Column('timestamp')
  addedAt: Date;
  @Column('varchar')
  likeStatus: LikeStatus;
}
