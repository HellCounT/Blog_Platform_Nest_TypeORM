import { isNil, isUndefined } from '@nestjs/common/utils/shared.utils';

export const isVoid = (val) => isNil(val) || isUndefined(val);
