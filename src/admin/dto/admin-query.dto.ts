// admin-query.dto.ts — DTO для параметров админки
import { IsOptional, IsInt, Min, IsString, IsDateString, IsUUID, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum EntityStatus {
  Pending = 'pending',
  Success = 'success',
  Failed = 'failed',
  Expired = 'expired',
}

export enum TransactionStatus {
  Pending = 'pending',
  Success = 'success',
  Failed = 'failed',
  Refunded = 'refunded',
  Partial = 'partial',
}

export class AdminQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;

  @IsOptional()
  @IsDateString()
  date_from?: string;

  @IsOptional()
  @IsDateString()
  date_to?: string;

  @IsOptional()
  @IsUUID()
  merchant_id?: string;

  @IsOptional()
  @IsUUID()
  provider_id?: string;

  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;

  @IsOptional()
  @IsUUID()
  click_id?: string;
}

export class MerchantUpdateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  api_key?: string;

  @IsOptional()
  @IsString()
  webhook_url?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class ProviderUpdateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  api_key?: string;

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsInt()
  cap?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
