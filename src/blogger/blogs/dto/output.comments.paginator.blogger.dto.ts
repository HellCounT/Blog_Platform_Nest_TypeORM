import { LikeStatus } from '../../../application-helpers/statuses';

export type CommentForBloggerViewType = {
  id: string;
  content: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  createdAt: string;
  postInfo: {
    id: string;
    title: string;
    blogId: string;
    blogName: string;
  };
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: LikeStatus;
  };
};
