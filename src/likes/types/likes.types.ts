export enum LikeStatus {
  none = 'None',
  like = 'Like',
  dislike = 'Dislike',
}

export type CommentLikeJoinedType = {
  id: string;
  commentId: string;
  userId: string;
  userLogin: string;
  addedAt: Date;
  likeStatus: LikeStatus;
};

export type PostLikeJoinedType = {
  id: string;
  postId: string;
  userId: string;
  userLogin: string;
  addedAt: Date;
  likeStatus: LikeStatus;
};
