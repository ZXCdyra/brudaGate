// rule.controller.ts — API для CRUD правил
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { RuleService } from './rule.service';
import { Rule } from './entities/rule.entity';

@Controller('admin/rules')
export class RuleController {
  constructor(private readonly ruleService: RuleService) {}

  @Get()
  async findAll(): Promise<Rule[]> {
    return this.ruleService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Rule> {
    return this.ruleService.findOne(id);
  }

  @Post()
  async create(@Body() data: Partial<Rule>): Promise<Rule> {
    return this.ruleService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<Rule>): Promise<Rule> {
    return this.ruleService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.ruleService.remove(id);
  }
}
