// provider.service.ts — Сервис для работы с провайдерами
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Provider } from './entities/provider.entity';

@Injectable()
export class ProviderService {
  constructor(
    @InjectRepository(Provider)
    private readonly providerRepo: Repository<Provider>,
  ) {}

  async findAll(): Promise<Provider[]> {
    return this.providerRepo.find();
  }

  async findOne(id: string): Promise<Provider> {
    const provider = await this.providerRepo.findOne({ where: { id } });
    if (!provider) {
      throw new NotFoundException(`Provider with id "${id}" not found`);
    }
    return provider;
  }

  async create(data: Partial<Provider>): Promise<Provider> {
    if (!data.type) {
      data.type = 'default';
    }
    return this.providerRepo.save(data);
  }

  async update(id: string, data: Partial<Provider>): Promise<Provider> {
    await this.providerRepo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.providerRepo.delete(id);
  }

  async checkCap(providerId: string): Promise<boolean> {
    const provider = await this.findOne(providerId);
    if (provider.cap === 0) {
      return true;
    }
    // В реальной реализации нужно хранить счётчик кликов
    return true;
  }
}
