// transaction.entity.ts — Сущность транзакции
import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'transaction_id' })
  @Index({ unique: true })
  transaction_id: string;

  @Column({ name: 'click_id' })
  @Index()
  click_id: string;

  @Column({ name: 'merchant_id' })
  @Index()
  merchant_id: string;

  @Column({ name: 'provider_id' })
  @Index()
  provider_id: string;

  @Column({ name: 'provider_transaction_id', nullable: true })
  @Index({ unique: true })
  provider_transaction_id?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount: number;

  @Column({ name: 'currency', default: 'USD' })
  currency: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'success', 'failed', 'refunded', 'partial'],
    default: 'pending',
  })
  status: string;

  @Column({ name: 'metadata', type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ name: 'retry_count', default: 0 })
  retry_count: number;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processed_at: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
