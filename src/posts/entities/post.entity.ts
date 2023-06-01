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
import { PostLike } from '../../likes/entities/post-like.entity';

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
  @OneToMany(() => PostLike, (pl) => pl.post)
  likes: PostLike[];
  static instantiate(
    postId: string,
    title: string,
    shortDescription: string,
    content: string,
    blogId: string,
    ownerId: string,
  ): Post {
    const post = new Post();
    post.id = postId;
    post.title = title;
    post.shortDescription = shortDescription;
    post.content = content;
    post.blogId = blogId;
    post.createdAt = new Date();
    post.ownerId = ownerId;
    post.likesCount = 0;
    post.dislikesCount = 0;
    return post;
  }
}
