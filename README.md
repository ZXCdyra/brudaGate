# BrudaGate — Traffic Aggregator (Merchant → Provider)

Полноценный агрегатор трафика для iGaming и affiliate-систем.

## Архитектура

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Merchant   │───▶│   BrudaGate  │───▶│   Provider   │
│  (Affiliate) │    │  (Router)    │    │   (Payment)  │
└──────────────┘    └──────────────┘    └──────────────┘
                         │  ▲
                         │  │ Webhook (stатус)
                         │  │
                    ┌────┴──▼────┐
                    │  Postback  │◀── Provider callback
                    └────────────┘
```

## Быстрая настройка

### 1. Скопируйте .env

```bash
cp .env.example .env
```

### 2. Запустите Docker

```bash
docker-compose up -d
```

Сервис будет доступен на `http://localhost:3000`

## API Endpoints

### 📍 Приём трафика

#### Через редирект (для рефералок)
```
GET /click?api_key=KEY&sub_id=123&geo=RU&device=mobile
```

#### Через API
```
POST /api/v1/traffic
Headers: { "x-api-key": "KEY" }
Body: {
  "sub_id": "123",
  "geo": "RU",
  "device": "mobile",
  "amount": 100
}
```

### 📊 API для проверки статуса

```
GET /click/{click_id}/status
GET /api/v1/transaction/{transaction_id}/status
```

### 🔄 Postback от провайдера

```
POST /postback/provider?provider=p1
Headers: { "x-api-key": "PROVIDER_KEY" }
Body: {
  "click_id": "uuid",
  "status": "success",
  "transaction_id": "tx-123",
  "amount": 100
}
```

### 📈 Отчёты и статистика

```
GET /reports/merchant/{merchantId}/stats?from=...&to=...
GET /reports/provider/{providerId}/stats
GET /reports/top-providers
GET /reports/transactions?limit=50
```

### 🔧 Admin API

```
GET    /api/admin/merchants      — список мерчантов
POST   /api/admin/merchants      — создать мерчанта
PUT    /api/admin/merchants/:id  — обновить
DELETE /api/admin/merchants/:id  — удалить

GET    /api/admin/providers
POST   /api/admin/providers
PUT    /api/admin/providers/:id
DELETE /api/admin/providers/:id

GET    /api/admin/rules
POST   /api/admin/rules
PUT    /api/admin/rules/:id
DELETE /api/admin/rules/:id
```

### 📤 Входящие webhook к мерчанту

```
POST /webhook/merchant/{merchantId}/status
Body: { "click_id", "status", "amount" }
```

## Конфигурация мерчантов и провайдеров

Все сущности можно добавлять через Admin API или напрямую в БД.

### Пример создания мерчанта
```json
POST /api/admin/merchants
{
  "name": "CasinoRoyale",
  "api_key": "key_m1_abc",
  "webhook_url": "https://your-domain.com/webhook",
  "active": true
}
```

### Пример создания провайдера
```json
POST /api/admin/providers
{
  "name": "NetEnt",
  "url": "https://netent.example.com",
  "api_key": "netent_key",
  "priority": 1,
  "cap": 1000,
  "type": "netent"
}
```

### Пример создания правила роутинга
```json
POST /api/admin/rules
{
  "name": "RU Mobile High Priority",
  "merchant_id": "merchant-uuid",
  "provider_id": "provider-uuid",
  "priority": 1,
  "geo": ["RU", "UA"],
  "devices": ["mobile"],
  "sources": [],
  "min_amount": 0,
  "max_amount": 100000,
  "hour_start": 0,
  "hour_end": 23,
  "weight": 100,
  "active": true
}
```

## Роутинг

1. Запрос приходит на `/click` или `/api/v1/traffic`
2. Система ищет по `api_key` мерчанта
3. По правилам (geo, device, source, amount, time) выбираются подходящие `rules`
4. Из подходящих правил выбирается одно по весу (weight) и приоритету
5. Клик сохраняется с `click_id`
6. Пользователь редиректится к провайдеру

## Postback и Webhook

- **Postback (входящий)**: Провайдер → `/postback/provider` → обновляет статус транзакции → отправляет webhook мерчанту
- **Webhook (исходящий)**: BrudaGate → `webhook_url` мерчанта с payload `{ click_id, transaction_id, status, amount }`

## Очереди (BullMQ)

- `postback` — обработка входящих postback от провайдеров
- `webhook` — отправка исходящих webhook к мерчантам (с retry)
- `statistics` — накопление статистики

## Развёртывание на Render

1. Создайте сервис в Render
2. Укажите:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod` (или `node dist/main.js`)
3. Добавьте PostgreSQL и Redis как сервисы
4. Установите переменные окружения из `.env.example`

## Структура проекта

```
src/
├── app.module.ts
├── main.ts
├── config/
│   └── configuration.ts
├── merchant/        # Мерчанты
├── provider/        # Провайдеры
├── rule/            # Правила роутинга
├── traffic/         # Приём трафика, клики, транзакции
├── webhook/         # Исходящие вебхууки
├── postback/        # Входящие постбэки
├── reporting/       # Статистика и отчёты
└── bull/            # Конфигурация очередей
```

## License

MIT
