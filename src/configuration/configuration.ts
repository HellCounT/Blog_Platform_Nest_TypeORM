import * as process from 'process';

export type ConfigurationType = {
  PGHOST: string;
  PGDATABASE: string;
  PGUSER: string;
  PGPASSWORD: string;
  PGPORT: number;
  PORT: number;
  BASIC_AUTH_LOGIN: string;
  BASIC_AUTH_PASSWORD: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_LIFETIME: number;
  JWT_REFRESH_LIFETIME: number;
  EMAIL_LOGIN: string;
  EMAIL_PASSWORD: string;
  ENV: string;
  S3_REGION: string;
  S3_ENDPOINT: string;
  S3_SECRET: string;
  S3_ID: string;
  S3_BASEURL: string;
};

export default (): ConfigurationType => ({
  PGHOST: process.env.PGHOST,
  PGDATABASE: process.env.PGDATABASE,
  PGUSER: process.env.PGUSER,
  PGPASSWORD: process.env.PGPASSWORD,
  PGPORT: parseInt(process.env.PGPORT, 10) || 5432,
  PORT: parseInt(process.env.PORT, 10) || 3000,
  BASIC_AUTH_LOGIN: process.env.BASIC_AUTH_LOGIN,
  BASIC_AUTH_PASSWORD: process.env.BASIC_AUTH_PASSWORD,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_LIFETIME: 360, //In sec
  JWT_REFRESH_LIFETIME: 480, //In sec
  EMAIL_LOGIN: process.env.EMAIL_LOGIN,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  ENV: process.env.NODE_ENV,
  S3_REGION: process.env.S3_REGION,
  S3_ENDPOINT: process.env.S3_ENDPOINT,
  S3_SECRET: process.env.S3_SECRET,
  S3_ID: process.env.S3_ID,
  S3_BASEURL: process.env.S3_BASEURL,
});
