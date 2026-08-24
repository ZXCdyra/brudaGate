// provider.entity.ts — Модель провайдера
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Click } from '../../traffic/entities/click.entity';

@Entity('providers')
export class Provider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  url: string;

  @Column()
  api_key: string;

  @Column({ default: 0 })
  priority: number;

  @Column({ type: 'jsonb', default: {} })
  config: Record<string, any>;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'int', default: 0 })
  cap: number; // Максимальное количество кликов в день

  @Column({ default: 'netent' })
  type: string; // netent, playngo, cpa, etc.

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Click, (click) => click.provider)
  clicks: Click[];
}
