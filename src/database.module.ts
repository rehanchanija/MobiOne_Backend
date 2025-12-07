import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        const uri =
          config.get<string>('MONGODB_URI') ||
          'mongodb://localhost:27017/mobione';
        return {
          uri,
          serverSelectionTimeoutMS: 5000,
          autoIndex: true,
          maxPoolSize: 5,
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
