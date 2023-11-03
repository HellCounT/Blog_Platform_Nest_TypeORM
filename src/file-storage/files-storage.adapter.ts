import {
  PutObjectCommand,
  PutObjectCommandOutput,
  S3Client,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { ConfigurationType } from '../configuration/configuration';
import { Injectable } from '@nestjs/common';
import { SaveFileResultType } from './save-file-result.type';

@Injectable()
export class S3StorageAdapter {
  s3Client: S3Client;
  bucketName = 'blog-platform';
  constructor(
    private readonly configService: ConfigService<ConfigurationType>,
  ) {
    this.s3Client = new S3Client({
      region: this.configService.get('S3_REGION'),
      endpoint: this.configService.get('S3_ENDPOINT'),
      credentials: {
        secretAccessKey: this.configService.get('S3_SECRET'),
        accessKeyId: this.configService.get('S3_ID'),
      },
    });
  }

  async uploadImage(key: string, buffer: Buffer): Promise<SaveFileResultType> {
    //todo: в юзкейсе формировать ключ через перебор по типам изображений
    const bucketParams = {
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: 'image/png',
    };

    const command = new PutObjectCommand(bucketParams);

    try {
      const uploadResult: PutObjectCommandOutput = await this.s3Client.send(
        command,
      );
      return {
        url: key,
        fileId: uploadResult.ETag,
      };
    } catch (exception) {
      console.error(exception);
      throw exception;
    }
  }
}
