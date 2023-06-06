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
import { CommentLike } from '../../likes/entities/comment-like.entity';

@Entity()
export class Comment {
  @PrimaryColumn('uuid')
  id: string;
  @Column('text')
  content: string;
  @ManyToOne(() => User, (u) => u.comments, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
  @Column('uuid')
  userId: string;
  @ManyToOne(() => Post, (p) => p.comments, { onDelete: 'CASCADE' })
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
  @OneToMany(() => CommentLike, (cl) => cl.comment)
  likes: CommentLike[];
  static instantiate(
    commentId: string,
    content: string,
    userId: string,
    postId: string,
  ): Comment {
    const comment = new Comment();
    comment.id = commentId;
    comment.content = content;
    comment.userId = userId;
    comment.postId = postId;
    comment.createdAt = new Date();
    comment.likesCount = 0;
    comment.dislikesCount = 0;
    return comment;
  }
}
