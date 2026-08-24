// routing.service.ts — Сервис роутинга трафика
import { Injectable, Logger, ServiceUnavailableException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Click } from '../entities/click.entity';
import { Rule } from '../../rule/entities/rule.entity';
import { Provider } from '../../provider/entities/provider.entity';
import { Merchant } from '../../merchant/entities/merchant.entity';
import { RuleService } from '../../rule/rule.service';
import { ProviderService } from '../../provider/provider.service';
import { v4 as uuidv4 } from 'uuid';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name);

  constructor(
    @InjectRepository(Click)
    private readonly clickRepo: Repository<Click>,
    private readonly ruleService: RuleService,
    private readonly providerService: ProviderService,
    @Optional() @InjectQueue('statistics') private statisticsQueue?: Queue,
  ) {}

  /**
   * Маршрутизирует клик к подходящему провайдеру
   * @param params - Параметры клика
   * @returns URL перенаправления и click_id
   */
  async routeTraffic(params: {
    api_key: string;
    sub_id?: string;
    geo?: string;
    device?: string;
    source?: string;
    amount?: number;
    ip?: string;
    user_agent?: string;
    referrer?: string;
  }): Promise<{ click_id: string; redirect_url: string; provider_id: string }> {
    try {
      // Проверяем API-ключ мерчанта
      const merchant = await this.findMerchantByApiKey(params.api_key);
      if (!merchant) {
        throw new Error('Invalid API key');
      }

      // Генерируем уникальный click_id
      const click_id = uuidv4();

      // Получаем подходящие правила
      const rules = await this.ruleService.getMatchingRules(
        merchant.id,
        params.geo,
        params.device,
        params.source,
        params.amount,
      );

      if (rules.length === 0) {
        throw new ServiceUnavailableException('No matching routing rules found');
      }

      // Выбираем провайдера по весу и приоритету
      const selectedRule = this.selectRuleByWeight(rules);
      const provider = await this.providerService.findOne(selectedRule.provider_id);

      // Сохраняем клик
      const click = this.clickRepo.create({
        click_id,
        merchant_id: merchant.id,
        provider_id: provider.id,
        sub_id: params.sub_id,
        geo: params.geo,
        device: params.device,
        source: params.source,
        ip: params.ip,
        user_agent: params.user_agent,
        referrer: params.referrer,
        amount: params.amount || 0,
        status: 'pending',
        metadata: {
          rule_id: selectedRule.id,
        },
      });

      await this.clickRepo.save(click);

      // Генерируем URL редиректа к провайдеру
      const redirect_url = this.buildRedirectUrl(provider, click_id, params);

      // Отправляем в очередь для статистики
      if (this.statisticsQueue) {
        try {
          await this.statisticsQueue.add('click', {
            click_id,
            merchant_id: merchant.id,
            provider_id: provider.id,
            amount: params.amount || 0,
          });
        } catch (e) {
          this.logger.warn('Failed to queue statistics:', e);
        }
      }

      this.logger.log(
        `Routed click ${click_id} to provider ${provider.name} (${provider.id}) via rule ${selectedRule.id}`,
      );

      return { click_id, redirect_url, provider_id: provider.id };
    } catch (error) {
      this.logger.error(`Routing error: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Ищет мерчанта по API ключу
   */
  private async findMerchantByApiKey(apiKey: string): Promise<Merchant | null> {
    return await this.clickRepo.manager
      .getRepository(Merchant)
      .findOne({ where: { api_key: apiKey, active: true } });
  }

  /**
   * Выбирает правило по весу с учётом приоритета
   */
  private selectRuleByWeight(rules: Rule[]): Rule {
    // Группировка по приоритету — сначала обрабатываем высокоприоритетные
    const sorted = rules.sort((a, b) => a.priority - b.priority);

    // Взвешенный случайный выбор
    let totalWeight = 0;
    const weights: number[] = [];

    for (const rule of sorted) {
      totalWeight += rule.weight;
      weights.push(totalWeight);
    }

    const random = Math.random() * totalWeight;

    for (let i = 0; i < weights.length; i++) {
      if (random <= weights[i]) {
        return sorted[i];
      }
    }

    return sorted[0];
  }

  /**
   * Строит URL редиректа к провайдеру
   */
  private buildRedirectUrl(
    provider: Provider,
    click_id: string,
    params: any,
  ): string {
    const url = new URL(provider.url);
    url.searchParams.set('click_id', click_id);
    url.searchParams.set('sub_id', params.sub_id || '');
    if (params.amount) {
      url.searchParams.set('amount', String(params.amount));
    }
    if (params.geo) {
      url.searchParams.set('geo', params.geo);
    }
    return url.toString();
  }
}
