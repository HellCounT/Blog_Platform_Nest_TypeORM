import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../../../users/entities/user.entity';
import { Blog } from '../../../blogs/entities/blog.entity';

@Entity()
export class Subscription {
  @PrimaryColumn('uuid')
  id: string;
  @ManyToOne(() => User, (u) => u.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
  @Column('uuid')
  userId: string;
  @ManyToOne(() => Blog, (b) => b.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn()
  blog: Blog;
  @Column('uuid')
  blogId: string;
  @Column('varchar')
  createdAt: string;
}
