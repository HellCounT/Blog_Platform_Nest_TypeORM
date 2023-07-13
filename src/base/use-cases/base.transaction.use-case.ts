import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';

export abstract class BaseTransactionUseCase<I, O> {
  protected constructor(
    @InjectDataSource() protected readonly dataSource: DataSource,
  ) {}

  protected abstract doBusiness(command: I, manager: EntityManager);

  protected async execute(command: I): Promise<O> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await this.doBusiness(command, queryRunner.manager);
      if (result) {
        await queryRunner.commitTransaction();
      } else {
        await queryRunner.rollbackTransaction();
      }

      return result;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      console.log(e);
    } finally {
      await queryRunner.release();
    }
  }
}
