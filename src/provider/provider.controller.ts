// provider.controller.ts — API для CRUD провайдеров
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ProviderService } from './provider.service';
import { Provider } from './entities/provider.entity';

@Controller('admin/providers')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @Get()
  async findAll(): Promise<Provider[]> {
    return this.providerService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Provider> {
    return this.providerService.findOne(id);
  }

  @Post()
  async create(@Body() data: Partial<Provider>): Promise<Provider> {
    return this.providerService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<Provider>): Promise<Provider> {
    return this.providerService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.providerService.remove(id);
  }
}
