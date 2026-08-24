// admin.controller.ts — Контроллер администрирования
import { Controller, Get, Put, Delete, Post, Body, Param, Query, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminQueryDto, MerchantUpdateDto, ProviderUpdateDto } from './dto/admin-query.dto';

@Controller('admin')
@UseInterceptors(ClassSerializerInterceptor)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Dashboard / Overview
   */
  @Get('dashboard')
  async getDashboard(
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
  ) {
    return this.adminService.getDashboard(dateFrom, dateTo);
  }

  /**
   * Список трафика (кликов)
   */
  @Get('traffic')
  async getTraffic(@Query() query: AdminQueryDto) {
    return this.adminService.getTrafficList(query);
  }

  /**
   * Список транзакций
   */
  @Get('transactions')
  async getTransactions(@Query() query: AdminQueryDto) {
    return this.adminService.getTransactionList(query);
  }

  /**
   * Список мерчантов
   */
  @Get('merchants')
  async getMerchants(@Query() query: AdminQueryDto) {
    return this.adminService.getMerchants(query);
  }

  /**
   * Детали мерчанта
   */
  @Get('merchants/:id')
  async getMerchant(@Param('id') id: string) {
    return this.adminService.getMerchant(id);
  }

  /**
   * Обновить мерчанта
   */
  @Put('merchants/:id')
  async updateMerchant(@Param('id') id: string, @Body() dto: MerchantUpdateDto) {
    return this.adminService.updateMerchant(id, dto);
  }

  /**
   * Забанить мерчанта
   */
  @Delete('merchants/:id/ban')
  async banMerchant(@Param('id') id: string) {
    const result = await this.adminService.banMerchant(id);
    return { success: true, message: `Merchant "${result.name}" banned` };
  }

  /**
   * Разбанить мерчанта
   */
  @Post('merchants/:id/unban')
  async unbanMerchant(@Param('id') id: string) {
    const result = await this.adminService.unbanMerchant(id);
    return { success: true, message: `Merchant "${result.name}" unbanned` };
  }

  /**
   * Отключить трафик для мерчанта
   */
  @Post('merchants/:id/disable-traffic')
  async disableTraffic(@Param('id') id: string) {
    const result = await this.adminService.disableTraffic(id);
    return { success: true, message: `Traffic disabled for merchant "${result.name}"` };
  }

  /**
   * Включить трафик для мерчанта
   */
  @Post('merchants/:id/enable-traffic')
  async enableTraffic(@Param('id') id: string) {
    const result = await this.adminService.enableTraffic(id);
    return { success: true, message: `Traffic enabled for merchant "${result.name}"` };
  }

  /**
   * Список провайдеров
   */
  @Get('providers')
  async getProviders(@Query() query: AdminQueryDto) {
    return this.adminService.getProviders(query);
  }

  /**
   * Детали провайдера
   */
  @Get('providers/:id')
  async getProvider(@Param('id') id: string) {
    return this.adminService.getProvider(id);
  }

  /**
   * Обновить провайдера
   */
  @Put('providers/:id')
  async updateProvider(@Param('id') id: string, @Body() dto: ProviderUpdateDto) {
    return this.adminService.updateProvider(id, dto);
  }

  /**
   * Забанить провайдера
   */
  @Delete('providers/:id/ban')
  async banProvider(@Param('id') id: string) {
    const result = await this.adminService.banProvider(id);
    return { success: true, message: `Provider "${result.name}" banned` };
  }

  /**
   * Разбанить провайдера
   */
  @Post('providers/:id/unban')
  async unbanProvider(@Param('id') id: string) {
    const result = await this.adminService.unbanProvider(id);
    return { success: true, message: `Provider "${result.name}" unbanned` };
  }

  /**
   * Список забаненных/отключённых сущностей
   */
  @Get('blocked')
  async getBlocked() {
    return this.adminService.getBlocked();
  }
}
