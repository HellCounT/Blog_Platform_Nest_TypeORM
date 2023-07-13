import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isVoid } from '../base/application-helpers/void.check.helper';
import { Comment } from './entities/comment.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectRepository(Comment) protected commentsRepo: Repository<Comment>,
  ) {}
  async getCommentById(commentId: string): Promise<Comment> {
    try {
      const comment = await this.commentsRepo.findOneBy({ id: commentId });
      if (isVoid(comment)) return null;
      return comment;
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async createComment(
    content: string,
    userId: string,
    postId: string,
  ): Promise<Comment | null> {
    try {
      const commentId = uuidv4();
      const newComment = Comment.instantiate(
        commentId,
        content,
        userId,
        postId,
      );
      await this.commentsRepo.save(newComment);
      return await this.getCommentById(newComment.id);
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async updateComment(
    commentId: string,
    content: string,
  ): Promise<boolean | null> {
    try {
      await this.commentsRepo.update(
        { id: commentId },
        {
          content: content,
        },
      );
      return true;
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async deleteComment(commentId: string): Promise<boolean | null> {
    try {
      await this.commentsRepo.delete({ id: commentId });
      return true;
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async updateLikesCounters(
    newLikesCount: number,
    newDislikesCount: number,
    commentId: string,
  ) {
    try {
      await this.commentsRepo.update(
        { id: commentId },
        {
          likesCount: newLikesCount,
          dislikesCount: newDislikesCount,
        },
      );
      return true;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}
