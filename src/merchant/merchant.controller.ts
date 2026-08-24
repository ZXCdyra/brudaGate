// merchant.controller.ts — API для CRUD мерчантов
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { Merchant } from './entities/merchant.entity';

@Controller('admin/merchants')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @Get()
  async findAll(): Promise<Merchant[]> {
    return this.merchantService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Merchant> {
    return this.merchantService.findOne(id);
  }

  @Post()
  async create(@Body() data: Partial<Merchant>): Promise<Merchant> {
    return this.merchantService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<Merchant>): Promise<Merchant> {
    return this.merchantService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.merchantService.remove(id);
  }
}
