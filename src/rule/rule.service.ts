// rule.service.ts — Сервис для работы с правилами роутинга
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Rule } from './entities/rule.entity';
import { Merchant } from '../merchant/entities/merchant.entity';
import { Provider } from '../provider/entities/provider.entity';

@Injectable()
export class RuleService {
  constructor(
    @InjectRepository(Rule)
    private readonly ruleRepo: Repository<Rule>,
  ) {}

  async findAll(): Promise<Rule[]> {
    return this.ruleRepo.find({
      relations: ['merchant', 'provider'],
    });
  }

  async findOne(id: string): Promise<Rule> {
    const rule = await this.ruleRepo.findOne({
      where: { id },
      relations: ['merchant', 'provider'],
    });
    if (!rule) {
      throw new NotFoundException(`Rule with id "${id}" not found`);
    }
    return rule;
  }

  async create(data: Partial<Rule>): Promise<Rule> {
    return this.ruleRepo.save(data);
  }

  async update(id: string, data: Partial<Rule>): Promise<Rule> {
    await this.ruleRepo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.ruleRepo.delete(id);
  }

  /**
   * Возвращает подходящие правила для маршрута
   * @param merchantId - ID мерчанта
   * @param geo - Гео (опционально)
   * @param device - Устройство (опционально)
   * @param source - Источник (опционально)
   * @param amount - Сумма (опционально)
   * @returns Массив подходящих правил, отсортированных по приоритету
   */
  async getMatchingRules(
    merchantId: string,
    geo?: string,
    device?: string,
    source?: string,
    amount?: number,
  ): Promise<Rule[]> {
    const currentHour = new Date().getHours();

    const query = this.ruleRepo
      .createQueryBuilder('rule')
      .where('rule.merchant_id = :merchantId', { merchantId })
      .andWhere('rule.active = true')
      .andWhere('rule.hour_start <= :hour', { hour: currentHour })
      .andWhere('rule.hour_end >= :hour', { hour: currentHour })
      .leftJoinAndSelect('rule.provider', 'provider')
      .andWhere('provider.active = true')
      .orderBy('rule.priority', 'ASC')
      .addOrderBy('rule.weight', 'DESC');

    // Фильтр по гео
    if (geo) {
      query
        .andWhere('(rule.geo IS EMPTY OR :geo = ANY(rule.geo))', { geo })
        .orWhere('NOT rule.geo @> CAST(:geo AS text[])', { geo });
    }

    // Фильтр по устройству
    if (device) {
      query.andWhere("(rule.devices IS EMPTY OR :device = ANY(rule.devices))", { device });
    }

    // Фильтр по источнику
    if (source) {
      query.andWhere("(rule.sources IS EMPTY OR :source = ANY(rule.sources))", { source });
    }

    // Фильтр по сумме
    if (amount !== undefined) {
      query
        .andWhere('rule.min_amount <= :amount', { amount })
        .andWhere('rule.max_amount >= :amount', { amount });
    }

    const rules = await query.getMany();
    return rules.sort((a, b) => a.priority - b.priority);
  }
}
