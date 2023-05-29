import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpiredTokenType } from './types/expired.token.type';
import { v4 as uuidv4 } from 'uuid';
import { ExpiredToken } from './entities/expired-token.entity';
import { isVoid } from '../../application-helpers/void.check.helper';

@Injectable()
export class ExpiredTokensRepository {
  constructor(
    @InjectRepository(ExpiredToken)
    protected expiredTokensRepo: Repository<ExpiredToken>,
  ) {}
  async addTokenToDb(refreshTokenMeta: string, userId: string) {
    const id: string = uuidv4();
    const token = new ExpiredToken();
    token.refreshTokenMeta = refreshTokenMeta;
    token.userId = userId;
    token.id = id;
    await this.expiredTokensRepo.save(token);
    return;
  }
  async findToken(tokenMeta: string): Promise<ExpiredTokenType | null> {
    try {
      const token = await this.expiredTokensRepo.findOneBy({
        refreshTokenMeta: tokenMeta,
      });
      if (isVoid(token)) return null;
      return token;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}
