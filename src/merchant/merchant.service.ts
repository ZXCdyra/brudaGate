// merchant.service.ts — Сервис для работы с мерчантами
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant } from './entities/merchant.entity';

@Injectable()
export class MerchantService {
  constructor(
    @InjectRepository(Merchant)
    private readonly merchantRepo: Repository<Merchant>,
  ) {}

  async findAll(): Promise<Merchant[]> {
    return this.merchantRepo.find();
  }

  async findOne(id: string): Promise<Merchant> {
    const merchant = await this.merchantRepo.findOne({ where: { id } });
    if (!merchant) {
      throw new NotFoundException(`Merchant with id "${id}" not found`);
    }
    return merchant;
  }

  async findByApiKey(apiKey: string): Promise<Merchant> {
    const merchant = await this.merchantRepo.findOne({
      where: { api_key: apiKey, active: true },
    });
    if (!merchant) {
      throw new NotFoundException(`Merchant with api_key "${apiKey}" not found or inactive`);
    }
    return merchant;
  }

  async create(data: Partial<Merchant>): Promise<Merchant> {
    return this.merchantRepo.save(data);
  }

  async update(id: string, data: Partial<Merchant>): Promise<Merchant> {
    await this.merchantRepo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.merchantRepo.delete(id);
  }
}
