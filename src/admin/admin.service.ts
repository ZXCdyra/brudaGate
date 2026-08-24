// admin.service.ts — Сервис администрирования
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Click } from '../traffic/entities/click.entity';
import { Transaction } from '../traffic/entities/transaction.entity';
import { Merchant } from '../merchant/entities/merchant.entity';
import { Provider } from '../provider/entities/provider.entity';
import { AdminQueryDto, MerchantUpdateDto, ProviderUpdateDto } from './dto/admin-query.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Click)
    private readonly clickRepo: Repository<Click>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Merchant)
    private readonly merchantRepo: Repository<Merchant>,
    @InjectRepository(Provider)
    private readonly providerRepo: Repository<Provider>,
  ) {}

  /**
   * Dashboard / Overview — агрегированная статистика
   */
  async getDashboard(dateFrom?: string, dateTo?: string) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    let dateFilter: any = Between(startOfDay, endOfDay);
    if (dateFrom && dateTo) {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      dateFilter = Between(from, to);
    }

    // Общее количество кликов за период
    const totalClicks = await this.clickRepo.count({
      where: { created_at: dateFilter },
    });

    // Конверсия: транзакции со статусом success / клики
    const successfulTransactions = await this.transactionRepo.count({
      where: {
        status: 'success',
        created_at: dateFilter,
      },
    });

    const conversionRate = totalClicks > 0 ? (successfulTransactions / totalClicks) * 100 : 0;

    // Трафик по провайдерам
    const trafficByProvider = await this.clickRepo
      .createQueryBuilder('click')
      .leftJoin('click.provider', 'provider')
      .select(['provider.id', 'provider.name'])
      .addSelect('COUNT(*)', 'clicks')
      .where('click.created_at BETWEEN :from AND :to', {
        from: dateFilter.value[0],
        to: dateFilter.value[1],
      })
      .groupBy('provider.id')
      .addGroupBy('provider.name')
      .getRawMany();

    // Блокированные/потерянные клики (статус failed/expired)
    const blockedClicks = await this.clickRepo.count({
      where: {
        created_at: dateFilter,
        status: MoreThanOrEqual('failed'),
      },
    });

    // Top 10 мерчантов по трафику
    const topMerchants = await this.clickRepo
      .createQueryBuilder('click')
      .leftJoin('click.merchant', 'merchant')
      .select(['merchant.id', 'merchant.name'])
      .addSelect('COUNT(*)', 'total_clicks')
      .addSelect('SUM(CASE WHEN click.status = :success THEN 1 ELSE 0 END)', 'successful_clicks')
      .where('click.created_at BETWEEN :from AND :to', {
        from: dateFilter.value[0],
        to: dateFilter.value[1],
      })
      .setParameters({ success: 'success' })
      .groupBy('merchant.id')
      .addGroupBy('merchant.name')
      .orderBy('total_clicks', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      period: {
        from: dateFilter.value[0],
        to: dateFilter.value[1],
      },
      total_clicks: Number(totalClicks),
      successful_transactions: Number(successfulTransactions),
      conversion_rate: Number(conversionRate.toFixed(2)),
      blocked_clicks: Number(blockedClicks),
      traffic_by_provider: trafficByProvider.map((row) => ({
        provider_id: row.provider_id,
        provider_name: row.provider_name,
        clicks: Number(row.clicks),
      })),
      top_merchants: topMerchants.map((row) => ({
        merchant_id: row.merchant_id,
        merchant_name: row.merchant_name,
        total_clicks: Number(row.total_clicks),
        successful_clicks: Number(row.successful_clicks),
      })),
    };
  }

  /**
   * Список кликов с пагинацией и фильтрами
   */
  async getTrafficList(query: AdminQueryDto) {
    const { page, limit, date_from, date_to, merchant_id, provider_id, status, click_id } = query;
    const skip = (page - 1) * limit;

    const qb = this.clickRepo
      .createQueryBuilder('click')
      .leftJoinAndSelect('click.merchant', 'merchant')
      .leftJoinAndSelect('click.provider', 'provider')
      .orderBy('click.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    // Фильтр по датам
    if (date_from && date_to) {
      const from = new Date(date_from);
      const to = new Date(date_to);
      to.setHours(23, 59, 59, 999);
      qb.andWhere('click.created_at BETWEEN :from AND :to', { from, to });
    }

    if (merchant_id) {
      qb.andWhere('click.merchant_id = :merchant_id', { merchant_id });
    }

    if (provider_id) {
      qb.andWhere('click.provider_id = :provider_id', { provider_id });
    }

    if (status) {
      qb.andWhere('click.status = :status', { status });
    }

    if (click_id) {
      qb.andWhere('click.click_id = :click_id', { click_id });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Список транзакций с пагинацией и фильтрами
   */
  async getTransactionList(query: AdminQueryDto) {
    const { page, limit, date_from, date_to, merchant_id, provider_id, status } = query;
    const skip = (page - 1) * limit;

    const qb = this.transactionRepo
      .createQueryBuilder('transaction')
      .orderBy('transaction.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    if (date_from && date_to) {
      const from = new Date(date_from);
      const to = new Date(date_to);
      to.setHours(23, 59, 59, 999);
      qb.andWhere('transaction.created_at BETWEEN :from AND :to', { from, to });
    }

    if (merchant_id) {
      qb.andWhere('transaction.merchant_id = :merchant_id', { merchant_id });
    }

    if (provider_id) {
      qb.andWhere('transaction.provider_id = :provider_id', { provider_id });
    }

    if (status) {
      qb.andWhere('transaction.status = :status', { status });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Список мерчантов
   */
  async getMerchants(query: AdminQueryDto) {
    const { page, limit, date_from, date_to } = query;
    const skip = (page - 1) * limit;

    const qb = this.merchantRepo
      .createQueryBuilder('merchant')
      .orderBy('merchant.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    if (date_from && date_to) {
      const from = new Date(date_from);
      const to = new Date(date_to);
      to.setHours(23, 59, 59, 999);
      qb.andWhere('merchant.created_at BETWEEN :from AND :to', { from, to });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Детали мерчанта
   */
  async getMerchant(id: string) {
    const merchant = await this.merchantRepo.findOne({
      where: { id },
      relations: ['clicks'],
    });

    if (!merchant) {
      throw new NotFoundException(`Merchant with id "${id}" not found`);
    }

    // Статистика
    const stats = await this.clickRepo
      .createQueryBuilder('click')
      .select('COUNT(*)', 'total_clicks')
      .addSelect('SUM(CASE WHEN click.status = :success THEN 1 ELSE 0 END)', 'successful_clicks')
      .addSelect('SUM(CASE WHEN click.status IN (:failed, :expired) THEN 1 ELSE 0 END)', 'failed_clicks')
      .where('click.merchant_id = :merchant_id', {
        merchant_id: id,
        success: 'success',
        failed: 'failed',
        expired: 'expired',
      })
      .getRawOne();

    return {
      ...merchant,
      stats: {
        total_clicks: Number(stats?.total_clicks || 0),
        successful_clicks: Number(stats?.successful_clicks || 0),
        failed_clicks: Number(stats?.failed_clicks || 0),
      },
    };
  }

  /**
   * Обновление мерчанта
   */
  async updateMerchant(id: string, dto: MerchantUpdateDto) {
    const merchant = await this.merchantRepo.findOne({ where: { id } });
    if (!merchant) {
      throw new NotFoundException(`Merchant with id "${id}" not found`);
    }

    Object.assign(merchant, dto);
    return this.merchantRepo.save(merchant);
  }

  /**
   * Бан мерчанта
   */
  async banMerchant(id: string) {
    const merchant = await this.merchantRepo.findOne({ where: { id } });
    if (!merchant) {
      throw new NotFoundException(`Merchant with id "${id}" not found`);
    }

    if (!merchant.active) {
      throw new BadRequestException('Merchant is already banned');
    }

    merchant.active = false;
    return this.merchantRepo.save(merchant);
  }

  /**
   * Разбан мерчанта
   */
  async unbanMerchant(id: string) {
    const merchant = await this.merchantRepo.findOne({ where: { id } });
    if (!merchant) {
      throw new NotFoundException(`Merchant with id "${id}" not found`);
    }

    if (merchant.active) {
      throw new BadRequestException('Merchant is already active');
    }

    merchant.active = true;
    return this.merchantRepo.save(merchant);
  }

  /**
   * Отключить трафик для мерчанта
   */
  async disableTraffic(id: string) {
    const merchant = await this.merchantRepo.findOne({ where: { id } });
    if (!merchant) {
      throw new NotFoundException(`Merchant with id "${id}" not found`);
    }

    merchant.active = false;
    return this.merchantRepo.save(merchant);
  }

  /**
   * Включить трафик для мерчанта
   */
  async enableTraffic(id: string) {
    const merchant = await this.merchantRepo.findOne({ where: { id } });
    if (!merchant) {
      throw new NotFoundException(`Merchant with id "${id}" not found`);
    }

    merchant.active = true;
    return this.merchantRepo.save(merchant);
  }

  /**
   * Список провайдеров
   */
  async getProviders(query: AdminQueryDto) {
    const { page, limit, date_from, date_to } = query;
    const skip = (page - 1) * limit;

    const qb = this.providerRepo
      .createQueryBuilder('provider')
      .orderBy('provider.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    if (date_from && date_to) {
      const from = new Date(date_from);
      const to = new Date(date_to);
      to.setHours(23, 59, 59, 999);
      qb.andWhere('provider.created_at BETWEEN :from AND :to', { from, to });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Детали провайдера
   */
  async getProvider(id: string) {
    const provider = await this.providerRepo.findOne({
      where: { id },
      relations: ['clicks'],
    });

    if (!provider) {
      throw new NotFoundException(`Provider with id "${id}" not found`);
    }

    return provider;
  }

  /**
   * Обновление провайдера
   */
  async updateProvider(id: string, dto: ProviderUpdateDto) {
    const provider = await this.providerRepo.findOne({ where: { id } });
    if (!provider) {
      throw new NotFoundException(`Provider with id "${id}" not found`);
    }

    Object.assign(provider, dto);
    return this.providerRepo.save(provider);
  }

  /**
   * Бан провайдера
   */
  async banProvider(id: string) {
    const provider = await this.providerRepo.findOne({ where: { id } });
    if (!provider) {
      throw new NotFoundException(`Provider with id "${id}" not found`);
    }

    if (!provider.active) {
      throw new BadRequestException('Provider is already banned');
    }

    provider.active = false;
    return this.providerRepo.save(provider);
  }

  /**
   * Разбан провайдера
   */
  async unbanProvider(id: string) {
    const provider = await this.providerRepo.findOne({ where: { id } });
    if (!provider) {
      throw new NotFoundException(`Provider with id "${id}" not found`);
    }

    if (provider.active) {
      throw new BadRequestException('Provider is already active');
    }

    provider.active = true;
    return this.providerRepo.save(provider);
  }

  /**
   * Список забаненных/отключённых мерчантов и провайдеров
   */
  async getBlocked() {
    const bannedMerchants = await this.merchantRepo.find({
      where: { active: false },
      order: { updated_at: 'DESC' },
    });

    const bannedProviders = await this.providerRepo.find({
      where: { active: false },
      order: { updated_at: 'DESC' },
    });

    return {
      merchants: bannedMerchants,
      providers: bannedProviders,
    };
  }
}
