import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './configuration/configuration';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersRepository } from './users/users.repository';
import { BlogsRepository } from './blogs/blogs.repository';
import { BlogsController } from './blogs/blogs.controller';
import { BlogsQuery } from './blogs/blogs.query';
import { PostsController } from './posts/posts.controller';
import { CommentsController } from './comments/comments.controller';
import { PostsRepository } from './posts/posts.repository';
import { PostsQuery } from './posts/posts.query';
import { CommentsQuery } from './comments/comments.query';
import { UsersQuery } from './users/users.query';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthController } from './auth/auth.controller';
import { AuthModule } from './auth/auth.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { DevicesController } from './security/devices/devices.controller';
import { LikesForCommentsRepository } from './likes/likes-for-comments.repository';
import { LikesForPostsRepository } from './likes/likes-for-posts.repository';
import { JwtAdapter } from './auth/jwt.adapter';
import { LikesForPostsService } from './likes/likes-for-posts.service';
import { LikesForCommentsService } from './likes/likes-for-comments.service';
import { EmailManager } from './email/email-manager';
import { JwtService } from '@nestjs/jwt';
import { DevicesRepository } from './security/devices/devices.repository';
import { ExpiredTokensRepository } from './security/tokens/expired.tokens.repository';
import { TokenBanService } from './security/tokens/token.ban.service';
import { CommentsRepository } from './comments/comments.repository';
import { IsUniqueEmailConstraint } from './auth/decorators/validation-decorators/is-unique-email.decorator';
import { IsNewLoginConstraint } from './auth/decorators/validation-decorators/is-new-login.decorator';
import { EmailIsNotConfirmedConstraint } from './auth/decorators/validation-decorators/email-is-not-confirmed.decorator';
import { EmailConfirmationCodeIsCorrectConstraint } from './auth/decorators/validation-decorators/confirmation-code-is-correct.decorator';
import { EmailService } from './email/email.service';
import { BlogExistsConstraint } from './blogs/decorators/validation-decorators/blog-exists.decorator';
import { SuperAdminBlogsQuery } from './superadmin/blogs/super-admin.blogs.query';
import { SuperAdminUsersQuery } from './superadmin/users/super-admin.users.query';
import { ConfirmUserEmailUseCase } from './auth/use-cases/confirm.user.email.use-case';
import { RegisterUserUseCase } from './auth/use-cases/register.user.use-case';
import { ResendActivationCodeUseCase } from './auth/use-cases/resend.activation.code.use-case';
import { SendPasswordRecoveryCodeUseCase } from './auth/use-cases/send.password.recovery.code.use-case';
import { UpdatePasswordByRecoveryCodeUseCase } from './auth/use-cases/update.password.by.recovery.code.use-case';
import { ValidateUserUseCase } from './auth/use-cases/validate.user.use-case';
import { CreateBlogUseCase } from './blogger/blogs/use-cases/create.blog.use-case';
import { CreatePostForBlogUseCase } from './blogger/blogs/use-cases/create.post.for.blog.use-case';
import { DeleteBlogUseCase } from './blogger/blogs/use-cases/delete.blog.use-case';
import { DeletePostUseCase } from './blogger/blogs/use-cases/delete.post.use-case';
import { UpdateBlogUseCase } from './blogger/blogs/use-cases/update.blog.use-case';
import { UpdatePostForBlogUseCase } from './blogger/blogs/use-cases/update.post.for.blog.use-case';
import { DeleteAllOtherSessionsUseCase } from './security/devices/use-cases/delete.all.other.sessions.use-case';
import { DeleteSessionUseCase } from './security/devices/use-cases/delete.session.use-case';
import { LogoutSessionUseCase } from './security/devices/use-cases/logout.session.use-case';
import { StartNewSessionUseCase } from './security/devices/use-cases/start.new.session.use-case';
import { UpdateSessionWithDeviceIdUseCase } from './security/devices/use-cases/update.session.with.device.id.use-case';
import { BindBlogToUserUseCase } from './superadmin/blogs/use-cases/bind.blog.to.user.use-case';
import { BanUserUseCase } from './superadmin/users/use-cases/ban.user.use-case';
import { CreateUserUseCase } from './superadmin/users/use-cases/create.user.use-case';
import { DeleteUserUseCase } from './superadmin/users/use-cases/delete.user.use-case';
import { CqrsModule } from '@nestjs/cqrs';
import { SuperAdminBlogsController } from './superadmin/blogs/super-admin.blogs.controller';
import { SuperAdminUsersController } from './superadmin/users/super-admin.users.controller';
import { BloggerBlogsController } from './blogger/blogs/blogger.blogs.controller';
import { BloggerBlogsQuery } from './blogger/blogs/blogger.blogs.query';
import { BloggerUsersController } from './blogger/users/blogger.users.controller';
import { UsersBannedByBloggerRepository } from './blogger/users/users-banned-by-blogger/users-banned-by-blogger.repository';
import { BanUserForBlogUseCase } from './blogger/users/use-cases/ban.user.for.blog.use-case';
import { BloggerUsersQuery } from './blogger/users/blogger.users.query';
import { BanBlogUseCase } from './superadmin/blogs/use-cases/ban.blog.use-case';
import { TypeOrmModule } from '@nestjs/typeorm';
import process from 'process';
import { TestInterceptor } from './test.interceptor';
import { CreateCommentUseCase } from './comments/use-cases/create.comment.use-case';
import { UpdateCommentUseCase } from './comments/use-cases/update.comment.use-case';
import { DeleteCommentUseCase } from './comments/use-cases/delete.comment.use-case';
import { UpdateCommentLikeStatusUseCase } from './comments/use-cases/update.comment.likestatus.use-case';
import { UpdatePostLikeStatusUseCase } from './posts/use-cases/update.post.likestatus.use-case';
import { User } from './users/entities/user.entity';
import { UserConfirmation } from './users/entities/user-confirmation.entity';
import { UserGlobalBan } from './users/entities/user-global-ban.entity';
import { UserRecovery } from './users/entities/user-recovery.entity';
import { Device } from './security/devices/entities/device.entity';
import { ExpiredToken } from './security/tokens/entities/expired-token.entity';
import { Blog } from './blogs/entities/blog.entity';
import { Post } from './posts/entities/post.entity';
import { Comment } from './comments/entities/comment.entity';
import { CommentLike } from './likes/entities/comment-like.entity';
import { PostLike } from './likes/entities/post-like.entity';
import { UserBannedByBlogger } from './blogger/users/users-banned-by-blogger/entities/user-banned-by-blogger.entity';
import { SuperAdminQuestionsController } from './superadmin/quiz/super-admin.questions.controller';
import { Question } from './superadmin/quiz/entities/question.entity';
import { CreateQuestionUseCase } from './superadmin/quiz/use-cases/create.question.use-case';
import { UpdateQuestionUseCase } from './superadmin/quiz/use-cases/update.question.use-case';
import { DeleteQuestionUseCase } from './superadmin/quiz/use-cases/delete.question.use-case';
import { ChangePublishedStatusUseCase } from './superadmin/quiz/use-cases/change.published.status.use-case';
import { QuestionsRepository } from './superadmin/quiz/questions.repository';
import { SuperAdminQuestionsQuery } from './superadmin/quiz/super-admin.questions.query';
import { QuizGameController } from './quiz/quiz-game.controller';
import { Player } from './quiz/entities/player.entity';
import { Answer } from './quiz/entities/answer.entity';
import { Game } from './quiz/entities/game.entity';
import { JoinOrCreateGameUseCase } from './quiz/use-cases/join.or.create.game.use-case';
import { SendAnswerUseCase } from './quiz/use-cases/send.answer.use-case';
import { GamesRepository } from './quiz/games.repository';
import { PlayersRepository } from './quiz/players.repository';
import { GamesQuery } from './quiz/games.query';
import { AnswersRepository } from './quiz/answers.repository';
import { S3StorageAdapter } from './file-storage/files-storage.adapter';

const entities = [
  User,
  UserConfirmation,
  UserGlobalBan,
  UserRecovery,
  Device,
  ExpiredToken,
  Blog,
  Post,
  Comment,
  CommentLike,
  PostLike,
  UserBannedByBlogger,
  Game,
  Player,
  Question,
  Answer,
];

const controllers = [
  AppController,
  AuthController,
  BlogsController,
  PostsController,
  CommentsController,
  DevicesController,
  SuperAdminBlogsController,
  SuperAdminUsersController,
  BloggerBlogsController,
  BloggerUsersController,
  SuperAdminQuestionsController,
  QuizGameController,
];

const services = [
  AppService,
  LikesForCommentsService,
  LikesForPostsService,
  TokenBanService,
  EmailService,
  JwtService,
];

const useCases = [
  ConfirmUserEmailUseCase,
  RegisterUserUseCase,
  ResendActivationCodeUseCase,
  SendPasswordRecoveryCodeUseCase,
  UpdatePasswordByRecoveryCodeUseCase,
  ValidateUserUseCase,
  CreateBlogUseCase,
  CreatePostForBlogUseCase,
  DeleteBlogUseCase,
  DeletePostUseCase,
  UpdateBlogUseCase,
  UpdatePostForBlogUseCase,
  DeleteAllOtherSessionsUseCase,
  DeleteSessionUseCase,
  LogoutSessionUseCase,
  StartNewSessionUseCase,
  UpdateSessionWithDeviceIdUseCase,
  BindBlogToUserUseCase,
  BanUserUseCase,
  CreateUserUseCase,
  DeleteUserUseCase,
  BanUserForBlogUseCase,
  BanBlogUseCase,
  CreateCommentUseCase,
  UpdateCommentUseCase,
  DeleteCommentUseCase,
  UpdateCommentLikeStatusUseCase,
  UpdatePostLikeStatusUseCase,
  CreateQuestionUseCase,
  UpdateQuestionUseCase,
  DeleteQuestionUseCase,
  ChangePublishedStatusUseCase,
  JoinOrCreateGameUseCase,
  SendAnswerUseCase,
];

const repositories = [
  BlogsRepository,
  PostsRepository,
  UsersRepository,
  LikesForCommentsRepository,
  LikesForPostsRepository,
  CommentsRepository,
  DevicesRepository,
  ExpiredTokensRepository,
  UsersBannedByBloggerRepository,
  QuestionsRepository,
  GamesRepository,
  PlayersRepository,
  AnswersRepository,
];

const query = [
  BlogsQuery,
  PostsQuery,
  CommentsQuery,
  UsersQuery,
  SuperAdminBlogsQuery,
  SuperAdminUsersQuery,
  BloggerBlogsQuery,
  BloggerUsersQuery,
  SuperAdminQuestionsQuery,
  GamesQuery,
];

const constraints = [
  IsUniqueEmailConstraint,
  IsNewLoginConstraint,
  EmailIsNotConfirmedConstraint,
  EmailConfirmationCodeIsCorrectConstraint,
  BlogExistsConstraint,
];

const adapters = [JwtAdapter, EmailManager, S3StorageAdapter];

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT, 10) || 5432,
      username: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ssl: true,
      autoLoadEntities: true,
      synchronize: true,
    }),
    TypeOrmModule.forFeature([...entities]),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'swagger-static'),
      serveRoot: process.env.NODE_ENV === 'development' ? '/' : '/swagger',
    }),
    AuthModule,
    ThrottlerModule.forRoot({
      ttl: parseInt(process.env.THROTTLE_TTL, 10),
      limit: parseInt(process.env.THROTTLE_LIMIT, 10),
    }),
    CqrsModule,
  ],
  controllers: [...controllers],
  providers: [
    TestInterceptor,
    //Services
    ...services,
    //UseCases
    ...useCases,
    //Query
    ...query,
    //Repository
    ...repositories,
    //Adapters
    ...adapters,
    //Constraints
    ...constraints,
  ],
})
export class AppModule {}
