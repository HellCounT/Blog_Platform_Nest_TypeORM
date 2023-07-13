import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { isVoid } from '../base/application-helpers/void.check.helper';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PostsRepository {
  constructor(@InjectRepository(Post) protected postsRepo: Repository<Post>) {}
  async getPostById(postId: string): Promise<Post> {
    try {
      const post = await this.postsRepo.findOneBy({ id: postId });
      if (isVoid(post)) return null;
      return post;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
  async createPost(
    title: string,
    shortDescription: string,
    content: string,
    blogId: string,
    ownerId: string,
  ): Promise<Post | null> {
    try {
      const postId = uuidv4();
      const newPost = Post.instantiate(
        postId,
        title,
        shortDescription,
        content,
        blogId,
        ownerId,
      );
      await this.postsRepo.save(newPost);
      return await this.getPostById(postId);
    } catch (e) {
      console.log(e);
      return null;
    }
  }
  async updatePost(
    postId: string,
    postTitle: string,
    shortDescription: string,
    content: string,
    blogId: string,
  ): Promise<boolean | null> {
    try {
      await this.postsRepo.update(
        { id: postId },
        {
          title: postTitle,
          shortDescription: shortDescription,
          content: content,
          blogId: blogId,
        },
      );
      return true;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
  async deletePost(postId: string): Promise<boolean> {
    try {
      await this.postsRepo.delete({ id: postId });
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
  async updateLikesCounters(
    newLikesCount: number,
    newDislikesCount: number,
    postId: string,
  ): Promise<void> {
    try {
      await this.postsRepo.update(
        { id: postId },
        {
          likesCount: newLikesCount,
          dislikesCount: newDislikesCount,
        },
      );
      return;
    } catch (e) {
      console.log(e);
      return;
    }
  }
}
