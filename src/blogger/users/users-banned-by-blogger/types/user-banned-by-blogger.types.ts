export type UserBannedByBloggerDbJoinedType = {
  blogId: string;
  bannedUserId: string;
  bannedUserLogin: string;
  banReason: string;
  banDate: Date;
};
