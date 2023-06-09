import { BanStatus, PublishedStatus } from './statuses';

export type QueryParserType = {
  searchNameTerm: string;
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
  pageNumber: number;
  pageSize: number;
};
export type UserQueryParserType = {
  banStatus: BanStatus;
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
  pageNumber: number;
  pageSize: number;
  searchLoginTerm: string | null;
  searchEmailTerm: string | null;
};
export type QuestionQueryParserType = {
  bodySearchTerm: string;
  publishedStatus: PublishedStatus;
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
  pageNumber: number;
  pageSize: number;
};
export type GamesQueryParserType = {
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
  pageNumber: number;
  pageSize: number;
};

export const parseQueryPagination = (query): QueryParserType => {
  const queryParamsParser: QueryParserType = {
    searchNameTerm: '',
    sortBy: 'createdAt',
    sortDirection: 'DESC',
    pageNumber: 1,
    pageSize: 10,
  };
  if (query.searchNameTerm)
    queryParamsParser.searchNameTerm = query.searchNameTerm.toString();
  if (query.sortBy) queryParamsParser.sortBy = query.sortBy.toString();
  if (query.sortDirection && query.sortDirection.toString() === 'asc')
    queryParamsParser.sortDirection = 'ASC';
  if (query.pageNumber) queryParamsParser.pageNumber = +query.pageNumber;
  if (query.pageSize) queryParamsParser.pageSize = +query.pageSize;
  return queryParamsParser;
};

export const parseUserQueryPagination = (query): UserQueryParserType => {
  const queryUserParamsParser: UserQueryParserType = {
    banStatus: BanStatus.all,
    sortBy: 'createdAt',
    sortDirection: 'DESC',
    pageNumber: 1,
    pageSize: 10,
    searchEmailTerm: null,
    searchLoginTerm: null,
  };
  if (query.searchLoginTerm)
    queryUserParamsParser.searchLoginTerm = query.searchLoginTerm.toString();
  else queryUserParamsParser.searchLoginTerm = '';
  if (query.searchEmailTerm)
    queryUserParamsParser.searchEmailTerm = query.searchEmailTerm.toString();
  else queryUserParamsParser.searchLoginTerm = '';
  if (query.sortBy) queryUserParamsParser.sortBy = query.sortBy.toString();
  if (query.sortDirection && query.sortDirection.toString() === 'asc')
    queryUserParamsParser.sortDirection = 'ASC';
  if (query.pageNumber) queryUserParamsParser.pageNumber = +query.pageNumber;
  if (query.pageSize) queryUserParamsParser.pageSize = +query.pageSize;
  if (query.banStatus) queryUserParamsParser.banStatus = query.banStatus;
  return queryUserParamsParser;
};

export const parseQuestionQueryPagination = (
  query,
): QuestionQueryParserType => {
  const queryQuestionParamsParser: QuestionQueryParserType = {
    bodySearchTerm: null,
    publishedStatus: PublishedStatus.all,
    sortBy: 'createdAt',
    sortDirection: 'DESC',
    pageNumber: 1,
    pageSize: 10,
  };
  if (query.bodySearchTerm)
    queryQuestionParamsParser.bodySearchTerm = query.bodySearchTerm.toString();
  if (query.publishedStatus)
    queryQuestionParamsParser.publishedStatus = query.publishedStatus;
  else queryQuestionParamsParser.bodySearchTerm = '';
  if (query.sortBy) queryQuestionParamsParser.sortBy = query.sortBy.toString();
  if (query.sortDirection && query.sortDirection.toString() === 'asc')
    queryQuestionParamsParser.sortDirection = 'ASC';
  if (query.pageNumber)
    queryQuestionParamsParser.pageNumber = +query.pageNumber;
  if (query.pageSize) queryQuestionParamsParser.pageSize = +query.pageSize;
  return queryQuestionParamsParser;
};

export const parseGameQueryPagination = (query): GamesQueryParserType => {
  const queryGamesParamsParser: GamesQueryParserType = {
    sortBy: 'pairCreatedDate',
    sortDirection: 'DESC',
    pageNumber: 1,
    pageSize: 10,
  };
  if (query.sortBy) queryGamesParamsParser.sortBy = query.sortBy.toString();
  if (query.sortDirection && query.sortDirection.toString() === 'asc')
    queryGamesParamsParser.sortDirection = 'ASC';
  if (query.pageNumber) queryGamesParamsParser.pageNumber = +query.pageNumber;
  if (query.pageSize) queryGamesParamsParser.pageSize = +query.pageSize;
  return queryGamesParamsParser;
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
