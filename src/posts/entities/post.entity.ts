import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Blog } from '../../blogs/entities/blog.entity';
import { User } from '../../users/etities/user.entity';
import { Comment } from '../../comments/entities/comment.entity';

@Entity()
export class Post {
  @PrimaryColumn('uuid')
  id: string;
  @Column('varchar')
  title: string;
  @Column('varchar')
  shortDescription: string;
  @Column('text')
  content: string;
  @ManyToOne(() => Blog, (b) => b.posts)
  @JoinColumn()
  blog: Blog;
  @Column('uuid')
  blogId: string;
  @Column('timestamp')
  createdAt: Date;
  @ManyToOne(() => User, (u) => u.posts)
  @JoinColumn()
  owner: User;
  @Column('uuid')
  ownerId: string;
  @Column('integer')
  likesCount: number;
  @Column('integer')
  dislikesCount: number;
  @OneToMany(() => Comment, (c) => c.post)
  comments: Comment[];
}
