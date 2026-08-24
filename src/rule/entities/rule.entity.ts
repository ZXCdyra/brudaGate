// rule.entity.ts — Модель правила роутинга
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Merchant } from '../../merchant/entities/merchant.entity';
import { Provider } from '../../provider/entities/provider.entity';

@Entity('rules')
export class Rule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  merchant_id: string;

  @Column()
  provider_id: string;

  @ManyToOne(() => Merchant)
  merchant: Merchant;

  @ManyToOne(() => Provider)
  provider: Provider;

  @Column({ default: 1 })
  priority: number;

  @Column({ type: 'text', array: true, default: [] })
  geo: string[];

  @Column({ type: 'text', array: true, default: [] })
  devices: string[];

  @Column({ type: 'text', array: true, default: [] })
  sources: string[];

  @Column({ type: 'int', default: 0 })
  min_amount: number;

  @Column({ type: 'int', default: 0 })
  max_amount: number;

  @Column({ type: 'int', default: 0 })
  hour_start: number; // 0-23

  @Column({ type: 'int', default: 23 })
  hour_end: number; // 0-23

  @Column({ default: 100 })
  weight: number; // Вес для случайного выбора

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'int', default: 0 })
  daily_cap: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
