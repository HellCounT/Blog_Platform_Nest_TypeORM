import { CommandHandler } from '@nestjs/cqrs';
import { CommentsRepository } from '../comments.repository';
import { PostsRepository } from '../../posts/posts.repository';
import { UsersRepository } from '../../users/users.repository';
import { CommentViewDto } from '../dto/output.comment.view.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsersBannedByBloggerRepository } from '../../blogger/users/users-banned-by-blogger/users-banned-by-blogger.repository';

export class CreateCommentCommand {
  constructor(
    public content: string,
    public userId: string,
    public postId: string,
  ) {}
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase {
  constructor(
    protected commentsRepo: CommentsRepository,
    protected readonly postsRepo: PostsRepository,
    protected readonly usersRepo: UsersRepository,
    protected readonly usersBannedByBloggerRepo: UsersBannedByBloggerRepository,
  ) {}
  async execute(command: CreateCommentCommand): Promise<CommentViewDto | null> {
    const foundUser = await this.usersRepo.getUserById(command.userId);
    const foundPost = await this.postsRepo.getPostById(command.postId);
    if (!foundUser || !foundPost) throw new NotFoundException();
    const bannedByBlogger = await this.usersBannedByBloggerRepo.findUserBan(
      foundPost.blogId,
      command.userId,
    );
    if (bannedByBlogger) throw new ForbiddenException();
    const createdComment = await this.commentsRepo.createComment(
      command.content,
      command.userId,
      command.postId,
    );
    return {
      id: createdComment.id,
      content: createdComment.content,
      commentatorInfo: {
        userId: foundUser.id,
        userLogin: foundUser.accountData.login,
      },
      createdAt: createdComment.createdAt.toISOString(),
      likesInfo: {
        likesCount: createdComment.likesCount,
        dislikesCount: createdComment.dislikesCount,
        myStatus: 'None',
      },
    };
  }
}
