import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Post } from '../../posts/entities/post.entity';
import { PostMainImageSizes } from '../../base/application-helpers/post.main.image.types';

@Entity()
export class PostMainImage {
  @PrimaryColumn('uuid')
  id: string;
  @ManyToOne(() => Post, (p) => p.mainImages, { onDelete: 'CASCADE' })
  @JoinColumn()
  post: Post;
  @Column('uuid')
  postId: string;
  @Column('varchar')
  imageSize: PostMainImageSizes;
  @Column('varchar')
  url: string;
  @Column('integer')
  width: number;
  @Column('integer')
  height: number;
  @Column('integer')
  fileSize: number;
  @Column('timestamp')
  uploadedAt: Date;
  static instantiate(
    imageId: string,
    postId: string,
    imageSize: PostMainImageSizes,
    url: string,
    width: number,
    height: number,
    fileSize: number,
  ) {
    const postMainImage = new PostMainImage();
    postMainImage.id = imageId;
    postMainImage.postId = postId;
    postMainImage.imageSize = imageSize;
    postMainImage.url = url;
    postMainImage.width = width;
    postMainImage.height = height;
    postMainImage.fileSize = fileSize;
    postMainImage.uploadedAt = new Date();
    return postMainImage;
  }
}
