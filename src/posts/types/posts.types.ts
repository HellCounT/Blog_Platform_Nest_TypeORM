export type PostViewModelType = {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
  extendedLikesInfo: ExtendedLikesInfoViewModelType;
};

export type LikesInfoViewModelType = {
  likesCount: number;
  dislikesCount: number;
  myStatus: string;
};

export type newestLike = {
  addedAt: string;
  userId: string;
  login: string;
};

export type ExtendedLikesInfoViewModelType = LikesInfoViewModelType & {
  newestLikes: newestLike[];
};

export type PostJoinedType = {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: Date;
  ownerId: string;
  ownerIsBanned: boolean;
  likesCount: number;
  dislikesCount: number;
  parentBlogIsBanned: boolean;
};
