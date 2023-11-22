import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';
import { UserBannedByBlogger } from '../../blogger/users/users-banned-by-blogger/entities/user-banned-by-blogger.entity';
import { BlogImage } from '../../images/entities/blog-image.entity';

@Entity()
export class Blog {
  @PrimaryColumn('uuid')
  id: string;
  @Column('varchar')
  name: string;
  @Column('varchar')
  description: string;
  @Column('varchar')
  websiteUrl: string;
  @Column('varchar')
  createdAt: string;
  @Column('boolean')
  isMembership: boolean;
  @ManyToOne(() => User, (u) => u.blogs)
  @JoinColumn()
  owner: User;
  @Column('uuid', { nullable: true })
  ownerId: string;
  @Column('boolean')
  isBanned: boolean;
  @Column('timestamp', { nullable: true })
  banDate: Date | null;
  @OneToMany(() => Post, (p) => p.blog)
  posts: Post[];
  @OneToMany(() => UserBannedByBlogger, (bb) => bb.blog)
  userBans: UserBannedByBlogger[];
  @OneToMany(() => BlogImage, (bmi) => bmi.blog)
  images: BlogImage[];
  static instantiate(
    blogId: string,
    name: string,
    description: string,
    websiteUrl: string,
    userId: string,
  ): Blog {
    const blog = new Blog();
    blog.id = blogId;
    blog.name = name;
    blog.description = description;
    blog.websiteUrl = websiteUrl;
    blog.createdAt = new Date().toISOString();
    blog.isMembership = false;
    blog.isBanned = false;
    blog.banDate = null;
    blog.ownerId = userId;
    return blog;
  }
}
