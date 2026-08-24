// click.entity.ts — Модель клика
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { Merchant } from '../../merchant/entities/merchant.entity';
import { Provider } from '../../provider/entities/provider.entity';

@Entity('clicks')
export class Click {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  click_id: string; // Уникальный идентификатор клика

  @Column({ nullable: true })
  merchant_id: string;

  @Column({ nullable: true })
  provider_id: string;

  @Column({ nullable: true })
  sub_id: string; // sub_id от мерчанта

  @Column({ nullable: true })
  geo: string;
  @Column({ nullable: true })
  device: string;
  @Column({ nullable: true })
  source: string;

  @Column({ nullable: true })
  ip: string;
  @Column({ nullable: true })
  user_agent: string;
  @Column({ nullable: true })
  referrer: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column({ default: 'pending' })
  status: string; // pending, success, failed, expired

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  provider_click_id: string; // ID в системе провайдера

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Merchant, (merchant) => merchant.clicks)
  @Index()
  merchant: Merchant;

  @ManyToOne(() => Provider, (provider) => provider.clicks)
  provider: Provider;

  @Column({ nullable: true })
  transaction_id: string; // Ссылка на транзакцию
}
