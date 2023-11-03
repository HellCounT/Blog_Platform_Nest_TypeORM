import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { ConfigurationType } from '../configuration/configuration';
import { Injectable } from '@nestjs/common';

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
}
