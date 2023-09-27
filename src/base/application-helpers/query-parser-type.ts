import { BanStatus, PublishedStatus } from './statuses';
import { isArray, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

type PagingType = {
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
  pageNumber: number;
  pageSize: number;
};
const paginatorDefaults: PagingType = {
  sortBy: 'createdAt',
  sortDirection: 'DESC',
  pageNumber: 1,
  pageSize: 10,
};
export type QueryParserType = PagingType & {
  searchNameTerm: string;
};
export type UserQueryParserType = PagingType & {
  banStatus: BanStatus;
  searchLoginTerm: string | null;
  searchEmailTerm: string | null;
};
export type QuestionQueryParserType = PagingType & {
  bodySearchTerm: string;
  publishedStatus: PublishedStatus;
};
export type GamesQueryParserType = PagingType;
export class TopPlayersQueryParserType {
  @Transform(({ value }) => {
    if (typeof value === 'string') return [value];
    if (isArray(value)) return value;
    return ['avgScores desc', 'sumScore desc'];
  })
  @IsOptional()
  sort = ['avgScores desc', 'sumScore desc'];
  @IsOptional()
  pageNumber: number;
  @IsOptional()
  pageSize: number;
}

const assignCommonPaginationFieldsValues = (query, queryParamsParser) => {
  if (query.sortBy) queryParamsParser.sortBy = query.sortBy.toString();
  if (query.sortDirection && query.sortDirection.toString() === 'asc')
    queryParamsParser.sortDirection = 'ASC';
  if (query.pageNumber) queryParamsParser.pageNumber = +query.pageNumber;
  if (query.pageSize) queryParamsParser.pageSize = +query.pageSize;
  return queryParamsParser;
};

export const parseQueryPagination = (query): QueryParserType => {
  let queryParamsParser: QueryParserType = {
    searchNameTerm: '',
    ...paginatorDefaults,
  };
  if (query.searchNameTerm)
    queryParamsParser.searchNameTerm = query.searchNameTerm.toString();
  queryParamsParser = assignCommonPaginationFieldsValues(
    query,
    queryParamsParser,
  );
  return queryParamsParser;
};

export const parseUserQueryPagination = (query): UserQueryParserType => {
  let queryUserParamsParser: UserQueryParserType = {
    banStatus: BanStatus.all,
    ...paginatorDefaults,
    searchEmailTerm: null,
    searchLoginTerm: null,
  };
  if (query.searchLoginTerm)
    queryUserParamsParser.searchLoginTerm = query.searchLoginTerm.toString();
  else queryUserParamsParser.searchLoginTerm = '';
  if (query.searchEmailTerm)
    queryUserParamsParser.searchEmailTerm = query.searchEmailTerm.toString();
  else queryUserParamsParser.searchLoginTerm = '';
  queryUserParamsParser = assignCommonPaginationFieldsValues(
    query,
    queryUserParamsParser,
  );
  if (query.banStatus) queryUserParamsParser.banStatus = query.banStatus;
  return queryUserParamsParser;
};

export const parseQuestionQueryPagination = (
  query,
): QuestionQueryParserType => {
  let queryQuestionParamsParser: QuestionQueryParserType = {
    bodySearchTerm: null,
    publishedStatus: PublishedStatus.all,
    ...paginatorDefaults,
  };
  if (query.bodySearchTerm)
    queryQuestionParamsParser.bodySearchTerm = query.bodySearchTerm.toString();
  if (query.publishedStatus)
    queryQuestionParamsParser.publishedStatus = query.publishedStatus;
  else queryQuestionParamsParser.bodySearchTerm = '';
  queryQuestionParamsParser = assignCommonPaginationFieldsValues(
    query,
    queryQuestionParamsParser,
  );
  return queryQuestionParamsParser;
};

export const parseGameQueryPagination = (query): GamesQueryParserType => {
  let queryGamesParamsParser: GamesQueryParserType = {
    ...paginatorDefaults,
    sortBy: 'pairCreatedDate',
  };
  queryGamesParamsParser = assignCommonPaginationFieldsValues(
    query,
    queryGamesParamsParser,
  );
  return queryGamesParamsParser;
};
//todo: complete parseTopPlayersQueryPagination
export const parseTopPlayersQueryPagination = (
  query,
): TopPlayersQueryParserType => {
  const queryTopPlayersParamsParser: TopPlayersQueryParserType = {
    sort: ['avgScores desc', 'sumScore desc'],
    pageNumber: 1,
    pageSize: 10,
  };
  if (query.pageNumber)
    queryTopPlayersParamsParser.pageNumber = +query.pageNumber;
  if (query.pageSize) queryTopPlayersParamsParser.pageSize = +query.pageSize;
  // const sortingProperties = pickSortingPropertiesForTopPlayers(
  //   queryTopPlayersParamsParser.sort,
  // );
  if (query.sort) queryTopPlayersParamsParser.sort = query.sort;
  return queryTopPlayersParamsParser;
};

export const getBanStatusForQuery = (banStatus: BanStatus): string => {
  if (banStatus === BanStatus.banned) {
    return `b."isBanned" = true AND `;
  } else if (banStatus === BanStatus.notBanned) {
    return `b."isBanned" = false AND `;
  } else return ``;
};

export const getPublishedStatusForQuery = (
  publishedStatus: PublishedStatus,
): boolean => {
  if (publishedStatus === PublishedStatus.notPublished) {
    return false;
  } else if (publishedStatus === PublishedStatus.published) {
    return true;
  } else if (publishedStatus === PublishedStatus.all) {
    return null;
  }
};

export const pickOrderForPostsQuery = (
  order: string,
  direction: 'ASC' | 'DESC',
): string => {
  let orderString = 'ORDER BY';
  switch (order) {
    case 'id':
      orderString += ' p."id"';
      break;
    case 'title':
      orderString += ' p."title"';
      break;
    case 'shortDescription':
      orderString += ' p."shortDescription"';
      break;
    case 'blogId':
      orderString += ' p."blogId"';
      break;
    case 'blogName':
      orderString += ' b."name"';
      break;
    case 'ownerId':
      orderString += ' p."ownerId"';
      break;
    default:
      orderString = 'ORDER BY p."createdAt"';
      break;
  }
  if (direction === 'ASC') {
    orderString += ' ASC';
  } else {
    orderString += ' DESC';
  }
  return orderString;
};

// const pickSortingPropertiesForTopPlayers = (sortingArray: string[]) => {
//   return sortingArray.map((s) => {
//     const [sortBy, order] = s.split(' ');
//     return { sortBy: sortBy, order: order };
//   });
// };
