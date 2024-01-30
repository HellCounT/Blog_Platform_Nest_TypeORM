import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryParserType } from '../../base/application-helpers/query-parser-type';
import { BlogViewModelType } from '../../blogs/types/blogs.types';
import { BlogsQuery } from '../../blogs/blogs.query';
import { CommentForBloggerViewType } from './dto/output.comments.paginator.blogger.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginatorType } from '../../base/application-helpers/paginator.type';
import { Blog } from '../../blogs/entities/blog.entity';
import { Post } from '../../posts/entities/post.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { isVoid } from '../../base/application-helpers/void.check.helper';
import { CommentLike } from '../../likes/entities/comment-like.entity';
import { LikeStatus } from '../../base/application-helpers/statuses';
import { PostViewModelType } from '../../posts/types/posts.types';
import { BlogImage } from '../../images/entities/blog-image.entity';
import { PostMainImage } from '../../images/entities/post-main-image.entity';
import { PostLike } from '../../likes/entities/post-like.entity';
import { PhotoSizeViewModel } from '../../blogs/dto/output.blog-image.dto';
import { S3StorageAdapter } from '../../file-storage/files-storage.adapter';
import { ConfigService } from '@nestjs/config';
import { ConfigurationType } from '../../configuration/configuration';

@Injectable()
export class BloggerBlogsQuery extends BlogsQuery {
  constructor(
    @InjectRepository(Blog) protected blogsRepo: Repository<Blog>,
    @InjectRepository(Post) protected postsRepo: Repository<Post>,
    @InjectRepository(Comment) protected commentsRepo: Repository<Comment>,
    @InjectRepository(CommentLike)
    protected commentLikeRepo: Repository<CommentLike>,
    @InjectRepository(BlogImage)
    protected blogImagesRepo: Repository<BlogImage>,
    @InjectRepository(PostMainImage)
    protected postMainImagesRepo: Repository<PostMainImage>,
    @InjectRepository(PostLike) protected postLikeRepo: Repository<PostLike>,
    protected readonly s3: S3StorageAdapter,
    protected readonly configService: ConfigService<ConfigurationType>,
  ) {
    super(blogsRepo, blogImagesRepo, s3, configService);
  }
  async getAllBlogsForBlogger(
    q: QueryParserType,
    userId,
  ): Promise<PaginatorType<BlogViewModelType>> {
    const offsetSize = (q.pageNumber - 1) * q.pageSize;
    const [reqPageDbBlogs, allBlogsCount] = await this.blogsRepo
      .createQueryBuilder('b')
      .select()
      .where(`b."ownerId" = :ownerId`, { ownerId: userId })
      .andWhere(`b."name" ILIKE '%' || COALESCE(:searchNameTerm, '') || '%'`, {
        searchNameTerm: q.searchNameTerm,
      })
      .orderBy(`"${q.sortBy}"`, q.sortDirection)
      .limit(q.pageSize)
      .offset(offsetSize)
      .getManyAndCount();
    const items = [];
    for await (const b of reqPageDbBlogs) {
      const blog = await this._mapBlogToViewType(b);
      items.push(blog);
    }
    return {
      pagesCount: Math.ceil(allBlogsCount / q.pageSize),
      page: q.pageNumber,
      pageSize: q.pageSize,
      totalCount: allBlogsCount,
      items: items,
    };
  }
  async getAllPostsForBlog(
    blogId: string,
    q: QueryParserType,
    userId: string,
  ): Promise<PaginatorType<PostViewModelType>> {
    const foundBlog = await this.blogsRepo.findOneBy({ id: blogId });
    if (!foundBlog) throw new NotFoundException(['wrong blog id']);
    if (foundBlog.ownerId !== userId) throw new ForbiddenException();
    const offsetSize = (q.pageNumber - 1) * q.pageSize;
    const [reqPageDbPosts, foundPostsCount] = await this.postsRepo.findAndCount(
      {
        where: {
          blogId: blogId,
          owner: {
            userGlobalBan: {
              isBanned: false,
            },
          },
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
      },
    );
    if (foundPostsCount === 0) return null;
    const items = [];
    for await (const p of reqPageDbPosts) {
      const post = await this._mapPostToViewType(p, userId);
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
  async getAllCommentsForBloggerPosts(
    q: QueryParserType,
    userId: string,
  ): Promise<PaginatorType<CommentForBloggerViewType>> {
    const offsetSize = (q.pageNumber - 1) * q.pageSize;
    const [reqPageDbComments, allCommentsCount] =
      await this.commentsRepo.findAndCount({
        where: {
          post: {
            ownerId: userId,
          },
        },
        order: { [q.sortBy]: q.sortDirection },
        take: q.pageSize,
        skip: offsetSize,
        relations: {
          user: true,
          post: {
            blog: true,
            owner: true,
          },
        },
      });
    if (allCommentsCount === 0) return null;
    const items = [];
    for await (const c of reqPageDbComments) {
      const comment = await this._mapCommentToBloggerViewType(c, userId);
      items.push(comment);
    }
    return {
      pagesCount: Math.ceil(allCommentsCount / q.pageSize),
      page: q.pageNumber,
      pageSize: q.pageSize,
      totalCount: allCommentsCount,
      items: items,
    };
  }
  private async _mapCommentToBloggerViewType(
    comment: Comment,
    userId: string,
  ): Promise<CommentForBloggerViewType> {
    const post: Post = await this.postsRepo.findOneBy({
      id: comment.postId,
    });
    if (isVoid(post)) return null;
    const like = await this.getUserLikeForComment(userId, comment.id);
    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      commentatorInfo: {
        userId: comment.userId,
        userLogin: comment.user.login,
      },
      likesInfo: {
        likesCount: comment.likesCount,
        dislikesCount: comment.dislikesCount,
        myStatus: like?.likeStatus || LikeStatus.none,
      },
      postInfo: {
        blogId: post.blogId,
        blogName: comment.post.blog.name,
        title: post.title,
        id: comment.postId,
      },
    };
  }
  async getUserLikeForComment(
    userId: string,
    commentId: string,
  ): Promise<CommentLike | null> {
    try {
      return await this.commentLikeRepo.findOne({
        where: {
          commentId: commentId,
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
      return null;
    }
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
    const postMainImages = await this.postMainImagesRepo.findBy({
      postId: post.id,
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
      images: {
        main: postMainImages.map((m) =>
          this._mapPostMainImageToPhotoSizeViewModel(m),
        ),
      },
    };
  }
  _mapPostMainImageToPhotoSizeViewModel(
    image: PostMainImage,
  ): PhotoSizeViewModel {
    return {
      url: this.configService.get('S3_BASEURL') + image.url,
      width: +image.width,
      height: +image.height,
      fileSize: +image.fileSize,
    };
  }
}
