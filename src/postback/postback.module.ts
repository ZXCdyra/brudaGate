// postback.module.ts — Модуль обработки postback
import { Module } from '@nestjs/common';
import { PostbackController } from './postback.controller';
import { PostbackProcessor } from './processors/postback.processor';
import { TrafficModule } from '../traffic/traffic.module';

@Module({
  imports: [TrafficModule],
  controllers: [PostbackController],
  providers: [PostbackProcessor],
  exports: [],
})
export class PostbackModule {}
