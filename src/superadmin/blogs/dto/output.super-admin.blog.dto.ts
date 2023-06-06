export class OutputSuperAdminBlogDto {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
  blogOwnerInfo: {
    userId: string | null;
    userLogin: string | null;
  };
  banInfo: {
    isBanned: boolean;
    banDate: string | null;
  };
}
