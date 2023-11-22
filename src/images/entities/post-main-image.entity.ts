import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Post } from '../../posts/entities/post.entity';

@Entity()
export class PostMainImage {
  @PrimaryColumn('uuid')
  id: string;
  @ManyToOne(() => Post, (p) => p.mainImages)
  @JoinColumn()
  post: Post;
  @Column('uuid')
  postId: string;
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
    postId: string,
    url: string,
    width: number,
    height: number,
    fileSize: number,
  ) {
    const postMainImage = new PostMainImage();
    postMainImage.id = imageId;
    postMainImage.postId = postId;
    postMainImage.url = url;
    postMainImage.width = width;
    postMainImage.height = height;
    postMainImage.fileSize = fileSize;
    postMainImage.uploadedAt = new Date();
    return postMainImage;
  }
}
