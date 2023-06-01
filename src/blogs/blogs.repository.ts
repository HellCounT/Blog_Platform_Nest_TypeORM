import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blog } from './entities/blog.entity';
import { isVoid } from '../application-helpers/void.check.helper';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BlogsRepository {
  constructor(@InjectRepository(Blog) protected blogsRepo: Repository<Blog>) {}
  async getBlogById(blogId: string): Promise<Blog> {
    try {
      const blog = this.blogsRepo.findOneBy({ id: blogId });
      if (isVoid(blog)) return null;
      return blog;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
  async createBlog(
    name: string,
    description: string,
    websiteUrl: string,
    userId: string,
  ): Promise<Blog> {
    try {
      const blogId = uuidv4();
      const newBlog = Blog.instantiate(
        blogId,
        name,
        description,
        websiteUrl,
        userId,
      );
      await this.blogsRepo.save(newBlog);
      return await this.getBlogById(newBlog.id);
    } catch (e) {
      console.log(e);
      return null;
    }
  }
  async updateBlog(
    blogId: string,
    name: string,
    description: string,
    websiteUrl: string,
    userId: string,
  ): Promise<boolean> {
    const blog = await this.getBlogById(blogId);
    if (!blog) throw new NotFoundException();
    if (blog.ownerId !== userId) throw new ForbiddenException();
    try {
      if (name)
        await this.blogsRepo.update(
          { id: blogId },
          {
            name: name,
          },
        );
      if (description)
        await this.blogsRepo.update(
          { id: blogId },
          {
            description: description,
          },
        );
      if (websiteUrl)
        await this.blogsRepo.update(
          { id: blogId },
          {
            websiteUrl: websiteUrl,
          },
        );
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
  async deleteBlog(blogId: string, userId: string): Promise<void> {
    const blog = await this.getBlogById(blogId);
    if (!blog) throw new NotFoundException();
    if (blog.ownerId !== userId) throw new ForbiddenException();
    try {
      await this.blogsRepo.delete({ id: blogId });
      return;
    } catch (e) {
      console.log(e);
      return;
    }
  }
  async banBlogById(blogId: string, isBanned: boolean): Promise<void> {
    try {
      let banDate: Date | null;
      if (isBanned) banDate = new Date();
      else banDate = null;
      await this.blogsRepo.update(
        { id: blogId },
        {
          isBanned: isBanned,
          banDate: banDate,
        },
      );
      return;
    } catch (e) {
      console.log(e);
      return;
    }
  }
  async bindUser(blogId: string, userId: string): Promise<void> {
    try {
      await this.blogsRepo.update(
        { id: blogId },
        {
          ownerId: userId,
        },
      );
      return;
    } catch (e) {
      console.log(e);
      return;
    }
  }
}
