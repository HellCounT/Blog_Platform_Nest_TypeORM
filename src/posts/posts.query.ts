import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryParser } from '../application-helpers/query.parser';
import { PostPaginatorType, PostViewModelType } from './types/posts.types';
import { LikeStatus } from '../likes/types/likes.types';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { Blog } from '../blogs/entities/blog.entity';
import { PostLike } from '../likes/entities/post-like.entity';
import { User } from '../users/etities/user.entity';

@Injectable()
export class PostsQuery {
  constructor(
    @InjectRepository(Post) protected postsRepo: Repository<Post>,
    @InjectRepository(Blog) protected blogsRepo: Repository<Blog>,
    @InjectRepository(PostLike) protected postLikeRepo: Repository<PostLike>,
    @InjectRepository(User) protected usersRepo: Repository<User>,
  ) {}
  async viewAllPosts(
    q: QueryParser,
    activeUserId: string,
  ): Promise<PostPaginatorType> {
    const offsetSize = (q.pageNumber - 1) * q.pageSize;
    const [reqPageDbPosts, allPostsCount] = await this.postsRepo
      .createQueryBuilder('p')
      .select()
      .leftJoin('b.blog', 'b')
      .leftJoin('p.owner', 'u')
      .leftJoin(`u."userGlobalBan"`, 'ub')
      .where(`ub."isBanned" = false`)
      .andWhere(`b."isBanned" = false`)
      .orderBy(`"${q.sortBy}"`, q.sortDirection)
      .limit(q.pageSize)
      .offset(offsetSize)
      .getManyAndCount();
    const items = [];
    for await (const p of reqPageDbPosts) {
      const post = await this._mapPostToViewType(p, activeUserId);
      items.push(post);
    }
    return {
      pagesCount: Math.ceil(allPostsCount / q.pageSize),
      page: q.pageNumber,
      pageSize: q.pageSize,
      totalCount: allPostsCount,
      items: items,
    };
  }
  async findPostById(
    postId: string,
    activeUserId: string,
  ): Promise<PostViewModelType | null> {
    const post = await this.postsRepo.findOneBy({ id: postId });
    if (!post) throw new NotFoundException();
    return this._mapPostToViewType(post, activeUserId);
  }
  async findPostsByBlogId(
    blogId: string,
    q: QueryParser,
    activeUserId: string,
  ): Promise<PostPaginatorType | null> {
    const blog: Blog = await this.blogsRepo.findOneBy({
      id: blogId,
    });
    if (!!blog) {
      const offsetSize = (q.pageNumber - 1) * q.pageSize;
      const [reqPageDbPosts, foundPostsCount] =
        await this.postsRepo.findAndCount({
          where: {
            blogId: blogId,
            owner: {
              userGlobalBan: {
                isBanned: false,
              },
            },
            blog: { isBanned: false },
          },
          order: { [q.sortBy]: q.sortDirection },
          take: q.pageSize,
          skip: offsetSize,
          relations: {
            blog: true,
            owner: {
              userGlobalBan: true,
            },
          },
        });
      if (reqPageDbPosts.length === 0) return null;
      else {
        const items = [];
        for await (const p of reqPageDbPosts) {
          const post = await this._mapPostToViewType(p, activeUserId);
          items.push(post);
        }
        return {
          pagesCount: Math.ceil(foundPostsCount / q.pageSize),
          page: q.pageNumber,
          pageSize: q.pageSize,
          totalCount: foundPostsCount,
          items: items,
        };
      }
    } else throw new NotFoundException();
  }
  async getUserLikeForPost(userId: string, postId: string): Promise<PostLike> {
    try {
      return await this.postLikeRepo.findOne({
        where: {
          postId: postId,
          userId: userId,
          user: {
            userGlobalBan: {
              isBanned: false,
            },
          },
        },
        relations: {
          user: {
            userGlobalBan: true,
          },
        },
      });
    } catch (e) {
      console.log(e);
      return;
    }
  }
  private async _getNewestLikes(postId: string): Promise<Array<PostLike>> {
    try {
      return await this.postLikeRepo.find({
        where: {
          postId: postId,
          likeStatus: LikeStatus.like,
          user: {
            userGlobalBan: {
              isBanned: false,
            },
          },
        },
        order: {
          addedAt: 'DESC',
        },
        take: 3,
        skip: 0,
        relations: {
          user: {
            userGlobalBan: true,
          },
        },
      });
    } catch (e) {
      console.log(e);
      return;
    }
  }
  async _mapPostToViewType(
    post: Post,
    activeUserId: string,
  ): Promise<PostViewModelType> {
    if (activeUserId === '')
      activeUserId = '3465cc2e-f49b-11ed-a05b-0242ac120003';
    const userLike = await this.getUserLikeForPost(activeUserId, post.id);
    const newestLikes = await this._getNewestLikes(post.id);
    const mappedLikes = newestLikes.map((l) => {
      return {
        addedAt: new Date(l.addedAt).toISOString(),
        userId: l.userId,
        login: l.user.login,
      };
    });
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blog.name,
      createdAt: new Date(post.createdAt).toISOString(),
      extendedLikesInfo: {
        likesCount: post.likesCount,
        dislikesCount: post.dislikesCount,
        myStatus: userLike?.likeStatus || LikeStatus.none,
        newestLikes: mappedLikes,
      },
    };
  }
}
