import { OutputBlogImageDto } from '../dto/output.blog-image.dto';

export type BlogViewModelType = {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
  images: OutputBlogImageDto;
};
