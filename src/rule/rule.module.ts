// rule.module.ts — Модуль правил
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RuleService } from './rule.service';
import { RuleController } from './rule.controller';
import { Rule } from './entities/rule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Rule])],
  providers: [RuleService],
  controllers: [RuleController],
  exports: [RuleService],
})
export class RuleModule {}
