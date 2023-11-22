import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Blog } from '../../blogs/entities/blog.entity';
import { ImageTypes } from '../../base/application-helpers/image.types';

@Entity()
export class BlogImage {
  @PrimaryColumn('uuid')
  id: string;
  @ManyToOne(() => Blog, (b) => b.mainImages)
  @JoinColumn()
  blog: Blog;
  @Column('uuid')
  blogId: string;
  @Column('varchar')
  imageType: ImageTypes;
  @Column('varchar')
  url: string;
  @Column('varchar')
  width: number;
  @Column('varchar')
  height: number;
  @Column('varchar')
  fileSize: number;
  @Column('timestamp')
  uploadedAt: Date;
  static instantiate(
    imageId: string,
    blogId: string,
    imageType: ImageTypes,
    url: string,
    width: number,
    height: number,
    fileSize: number,
  ) {
    const postMainImage = new BlogImage();
    postMainImage.id = imageId;
    postMainImage.blogId = blogId;
    postMainImage.imageType = imageType;
    postMainImage.url = url;
    postMainImage.width = width;
    postMainImage.height = height;
    postMainImage.fileSize = fileSize;
    postMainImage.uploadedAt = new Date();
    return postMainImage;
  }
}
