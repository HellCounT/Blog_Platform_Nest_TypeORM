import { QueryParserType } from '../base/application-helpers/query-parser-type';
import { BlogViewModelType } from './types/blogs.types';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Blog } from './entities/blog.entity';
import { PaginatorType } from '../base/application-helpers/paginator.type';
import { BlogImage } from '../images/entities/blog-image.entity';
import { ImageTypes } from '../base/application-helpers/image.types';
import { PhotoSizeViewModel } from './dto/output.blog-image.dto';
import { S3StorageAdapter } from '../file-storage/files-storage.adapter';

@Injectable()
export class BlogsQuery {
  constructor(
    @InjectRepository(Blog) protected blogsRepo: Repository<Blog>,
    @InjectRepository(BlogImage)
    protected blogImagesRepo: Repository<BlogImage>,
    protected readonly s3: S3StorageAdapter,
  ) {}
  async viewAllBlogs(
    q: QueryParserType,
  ): Promise<PaginatorType<BlogViewModelType>> {
    const offsetSize = (q.pageNumber - 1) * q.pageSize;
    const [reqPageDbBlogs, allBlogsCount] = await this.blogsRepo.findAndCount({
      where: {
        name: ILike('%' + q.searchNameTerm + '%'),
        isBanned: false,
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
        owner: {
          userGlobalBan: true,
        },
      },
    });
    if (allBlogsCount === 0) return null;
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
  async findBlogById(blogId: string): Promise<BlogViewModelType> {
    const foundBlog = await this.blogsRepo.findOneBy({
      id: blogId,
      isBanned: false,
    });
    if (foundBlog) return this._mapBlogToViewType(foundBlog);
    else throw new NotFoundException();
  }
  async _mapBlogToViewType(blog: Blog): Promise<BlogViewModelType> {
    const wallpaper = await this.blogImagesRepo.findOneBy({
      blogId: blog.id,
      imageType: ImageTypes.wallpaper,
    });
    const mainImages = await this.blogImagesRepo.findBy({
      blogId: blog.id,
      imageType: ImageTypes.main,
    });
    return {
      id: blog.id,
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt,
      isMembership: blog.isMembership,
      images: {
        wallpaper: this._mapImageToPhotoSizeViewModel(wallpaper),
        main: mainImages.map((m) => this._mapImageToPhotoSizeViewModel(m)),
      },
    };
  }
  _mapImageToPhotoSizeViewModel(image: BlogImage): PhotoSizeViewModel {
    if (!image) return null;
    return {
      url: image.url,
      width: +image.width,
      height: +image.height,
      fileSize: +image.fileSize,
    };
  }

  async getImageFile(key: string) {
    return this.s3.getImage(key);
  }
}
