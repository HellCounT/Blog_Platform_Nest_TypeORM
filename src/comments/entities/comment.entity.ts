import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../../users/etities/user.entity';
import { Post } from '../../posts/entities/post.entity';

@Entity()
export class Comment {
  @PrimaryColumn('uuid')
  id: string;
  @Column('text')
  content: string;
  @ManyToOne(() => User, (u) => u.comments)
  @JoinColumn()
  user: User;
  @Column('uuid')
  userId: string;
  @ManyToOne(() => Post, (p) => p.comments)
  @JoinColumn()
  post: Post;
  @Column('uuid')
  postId: string;
  @Column('timestamp')
  createdAt: Date;
  @Column('integer')
  likesCount: number;
  @Column('integer')
  dislikesCount: number;
}
