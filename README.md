# 城市地下综合管廊智能监控与运维调度系统

> 基于 Node.js + Express + TypeScript + SQLite 的城市地下综合管廊智能监控与运维调度系统后端API

## 目录结构

```
tunnel-monitoring-system/
├── data/                      # SQLite数据库文件目录
├── src/
│   ├── app.ts                 # 应用入口
│   ├── data-source.ts         # 数据库连接配置
│   ├── init-db.ts             # 数据库初始化脚本
│   ├── config/
│   │   └── index.ts           # 系统配置
│   ├── entities/              # 数据库实体 (20个)
│   ├── services/              # 业务服务层
│   ├── controllers/           # 控制器层
│   ├── middleware/            # 中间件
│   └── routes/
│       └── index.ts           # 路由定义
├── .env                       # 环境变量配置
├── docker-compose.yml         # PostgreSQL容器编排
├── package.json
├── tsconfig.json
└── README.md
```

## 功能特性

### 1. 传感器数据采集与告警模块
- 支持温湿度、CH₄/H₂S/CO/O₂气体浓度、水位、烟雾、振动等多类型传感器
- 基于预设阈值自动触发两级告警（警告/告警）
- 根据事件类型和严重等级自动匹配应急处置预案
- 自动关联资源调配任务
- 告警超时未处理自动升级通知上级

### 2. 设备控制与能耗管理模块
- 支持通风、排水、照明、消防、水泵等设备的智能控制
- 环境参数异常时自动启动设备，恢复正常后自动关闭
- 记录完整的调控日志
- 自动生成日/月能耗统计报告

### 3. 巡检与工单管理模块
- 支持机器人巡检和人工巡检数据上报
- 系统自动比对历史数据，发现异常自动生成工单
- 按问题类型、位置智能分配至对应维护班组
- 工单超时未处理自动升级（三级：班组负责人→运维主管→运维经理）

### 4. 顽固隐患识别模块
- 维护人员上传处理记录后，系统自动识别重复问题
- 同一类型问题3次出现自动标记为顽固隐患
- 推送针对性的深度检查建议

### 5. 入廊申请与管线管理模块
- 管线单位提交入廊申请时，系统根据管线类型、安全间距、空间占用自动推荐最优敷设路径
- 自动生成入廊合同与费用账单
- 费用按占用长度与维护成本自动计算
- 逾期3次未缴费自动限制入廊并通知

### 6. 实时推送模块
- 所有告警、工单状态、设备调控记录、入廊审批结果实时推送
- 支持运维人员终端与指挥中心大屏
- 基于WebSocket的高性能实时通信

### 7. 报表统计与导出模块
- 每日凌晨2点自动生成综合运维报表
- 统计指标：告警响应时长、故障率、设备能耗、巡检完成率、工单完成率等
- 支持按廊段和时间维度筛选
- 支持导出Excel格式

## 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm 或 yarn
- SQLite（内置，无需额外安装）

### 方式一：快速启动（SQLite，推荐）

#### 1. 安装依赖

```bash
npm install
```

#### 2. 初始化数据库（建表 + 插入测试数据）

```bash
npm run init-db
```

该命令会自动：
- 创建所有数据库表
- 创建7个测试用户账号
- 创建3个管廊段
- 创建9个传感器（含阈值配置）
- 创建7个设备
- 创建4个应急预案
- 创建3个管线单位

#### 3. 启动开发服务器

```bash
npm run dev
```

服务器将运行在 `http://localhost:3000`

### 方式二：使用 PostgreSQL（可选）

#### 1. 启动 PostgreSQL 容器

```bash
docker-compose up -d
```

#### 2. 修改 `.env` 文件

```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=tunnel_monitor
```

#### 3. 后续步骤同方式一

```bash
npm install
npm run init-db
npm run dev
```

## 测试账号

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | 123456 | 系统管理员 | 拥有所有权限 |
| supervisor | 123456 | 维护主管 | 管理工单分配和升级 |
| worker1 | 123456 | 维护人员(一班) | 处理分配的工单 |
| worker2 | 123456 | 维护人员(二班) | 处理分配的工单 |
| inspector | 123456 | 巡检人员 | 上报巡检数据 |
| command | 123456 | 指挥中心 | 查看全局监控 |
| pipeline_unit | 123456 | 管线单位 | 提交入廊申请 |

## API 文档

### 基础信息

- Base URL: `http://localhost:3000/api`
- 认证方式: Bearer Token (JWT)
- Content-Type: application/json

### 1. 认证接口

#### 登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "123456"
}
```

**响应示例:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "username": "admin",
    "realName": "系统管理员",
    "role": "admin"
  }
}
```

#### 获取当前用户信息
```http
GET /api/auth/me
Authorization: Bearer {token}
```

### 2. 传感器数据采集接口（核心）

#### 采集传感器数据
```http
POST /api/sensors/data
Authorization: Bearer {token}
Content-Type: application/json

{
  "sensorCode": "SEN-003-CH4",
  "value": 3.0,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**说明:**
- 当 value 超过阈值时，系统会自动创建告警
- 触发条件：SEN-003-CH4 的告警阈值是 2.5，所以 3.0 会触发严重告警
- 系统会自动匹配相应的应急预案并发送通知

#### 获取传感器列表
```http
GET /api/sensors?tunnelSectionId={tunnelSectionId}
Authorization: Bearer {token}
```

#### 获取传感器历史数据
```http
GET /api/sensors/{sensorId}/data?page=1&pageSize=100
Authorization: Bearer {token}
```

#### 获取传感器最新数据
```http
GET /api/sensors/{sensorId}/latest
Authorization: Bearer {token}
```

### 3. 告警接口

#### 获取活动告警列表
```http
GET /api/alarms/active
Authorization: Bearer {token}
```

#### 获取告警历史
```http
GET /api/alarms/history?page=1&pageSize=20
Authorization: Bearer {token}
```

#### 确认告警
```http
PUT /api/alarms/{alarmId}/acknowledge
Authorization: Bearer {token}
```

#### 解决告警
```http
PUT /api/alarms/{alarmId}/resolve
Authorization: Bearer {token}
Content-Type: application/json

{
  "resolution": "已处理完成"
}
```

### 4. 设备控制接口

#### 获取设备列表
```http
GET /api/devices?tunnelSectionId={tunnelSectionId}
Authorization: Bearer {token}
```

#### 手动控制设备（核心）
```http
PUT /api/devices/{deviceId}/control
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "on",
  "reason": "手动测试"
}
```

**说明:**
- status: "on" | "off"
- 系统会记录控制日志
- 关闭设备时会自动计算运行时长和能耗

#### 获取设备控制日志
```http
GET /api/devices/{deviceId}/logs?page=1&pageSize=20
Authorization: Bearer {token}
```

### 5. 巡检与工单接口（核心）

#### 上报巡检数据
```http
POST /api/inspections
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "manual",
  "tunnelSectionId": "{tunnelSectionId}",
  "route": "K0+000 至 K1+500",
  "findings": "发现管道接口有轻微渗漏",
  "anomalyData": {
    "anomalies": [
      {
        "type": "漏水",
        "category": "管道问题",
        "description": "管道接口有轻微渗漏",
        "priority": "high"
      }
    ]
  }
}
```

**说明:**
- 当 anomalyData 存在时，系统会自动生成工单
- 工单会智能分配给工作量最少的维护人员
- 系统会自动检测重复问题

#### 创建工单
```http
POST /api/work-orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "管道接口漏水修复",
  "description": "中心大道段K0+500处管道接口漏水",
  "problemType": "漏水",
  "problemCategory": "管道问题",
  "priority": "high",
  "tunnelSectionId": "{tunnelSectionId}",
  "location": "K0+500"
}
```

#### 获取工单列表
```http
GET /api/work-orders?status=assigned&assigneeId={userId}&page=1&pageSize=20
Authorization: Bearer {token}
```

**可选参数:**
- status: created | assigned | in_progress | completed | closed | escalated | overdue
- priority: low | medium | high | urgent
- assigneeId: 负责人ID
- tunnelSectionId: 管廊段ID
- isRecurring: 是否重复问题

#### 开始处理工单
```http
PUT /api/work-orders/{workOrderId}/start
Authorization: Bearer {token}
```

#### 完成工单（核心）
```http
PUT /api/work-orders/{workOrderId}/complete
Authorization: Bearer {token}
Content-Type: application/json

{
  "resolution": "已更换密封圈，漏水问题已解决",
  "resolutionImages": ["image1.jpg", "image2.jpg"]
}
```

**说明:**
- 系统会自动检查是否为重复问题
- 同一类型问题3次出现会标记为顽固隐患
- 自动推送深度检查建议

### 6. 入廊申请接口

#### 获取管线单位列表
```http
GET /api/pipeline-units
Authorization: Bearer {token}
```

#### 提交入廊申请（核心）
```http
POST /api/entry-applications
Authorization: Bearer {token}
Content-Type: application/json

{
  "pipelineUnitId": "{pipelineUnitId}",
  "pipelineType": "gas",
  "pipelineDiameter": 300,
  "requiredLength": 500,
  "startTunnelSectionId": "{startSectionId}",
  "endTunnelSectionId": "{endSectionId}",
  "proposedRoute": "沿管廊上部右侧敷设"
}
```

**说明:**
- 系统会自动分析并推荐最优敷设路径
- 自动计算安全间距和空间占用
- 自动生成费用估算

#### 获取入廊申请列表
```http
GET /api/entry-applications?page=1&pageSize=20
Authorization: Bearer {token}
```

#### 批准入廊申请
```http
PUT /api/entry-applications/{applicationId}/approve
Authorization: Bearer {token}
```

**说明:**
- 系统自动生成入廊合同和费用账单
- 自动发送通知给管线单位

### 7. 报表统计接口

#### 获取日报表
```http
GET /api/reports/daily?tunnelSectionId={sectionId}&page=1&pageSize=30
Authorization: Bearer {token}
```

#### 获取统计数据
```http
GET /api/reports/statistics?startDate=2024-01-01&endDate=2024-01-31&tunnelSectionId={sectionId}
Authorization: Bearer {token}
```

#### 导出Excel报表
```http
GET /api/reports/export?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer {token}
```

### 8. 通知接口

#### 获取通知列表
```http
GET /api/notifications?isRead=false&page=1&pageSize=20
Authorization: Bearer {token}
```

#### 标记通知已读
```http
PUT /api/notifications/{notificationId}/read
Authorization: Bearer {token}
```

#### 全部标记已读
```http
PUT /api/notifications/read-all
Authorization: Bearer {token}
```

## WebSocket 实时推送

### 连接端点
```
ws://localhost:3000/ws
```

### 认证消息
```json
{
  "type": "authenticate",
  "userId": "{userId}",
  "roles": ["admin"]
}
```

### 订阅主题
```json
{
  "type": "subscribe",
  "topics": ["sensor_data", "alarm_created", "work_order_updated"]
}
```

### 可用主题

| 主题 | 说明 |
|------|------|
| sensor_data | 传感器实时数据 |
| alarm_created | 新告警生成 |
| alarm_updated | 告警状态更新 |
| alarm_escalated | 告警升级 |
| device_updated | 设备状态更新 |
| work_order_created | 新工单创建 |
| work_order_assigned | 工单分配 |
| work_order_updated | 工单状态更新 |
| work_order_escalated | 工单升级 |
| hidden_danger_detected | 顽固隐患检测 |
| entry_application_created | 新入廊申请 |
| entry_application_approved | 入廊申请批准 |
| notification | 通知消息 |

## 定时任务

系统内置以下定时任务：

| 频率 | 任务 |
|------|------|
| 每5分钟 | 检查逾期工单，自动升级 |
| 每30分钟 | 检查逾期账单，发送提醒 |
| 每分钟 | 根据环境数据自动控制设备 |
| 每天凌晨2点 | 生成日报表和能耗统计 |

## 核心业务流程测试

### 测试传感器告警流程

```bash
# 1. 登录获取token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'

# 2. 获取管廊段列表（从数据库或init-db输出中获取ID）

# 3. 获取传感器列表，获取传感器code
curl http://localhost:3000/api/sensors?tunnelSectionId={sectionId} \
  -H "Authorization: Bearer {token}"

# 4. 发送超过阈值的传感器数据，触发告警
curl -X POST http://localhost:3000/api/sensors/data \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"sensorCode":"SEN-003-CH4","value":3.0}'

# 5. 查看活动告警
curl http://localhost:3000/api/alarms/active \
  -H "Authorization: Bearer {token}"
```

### 测试工单创建和分配流程

```bash
# 1. 以巡检员身份登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"inspector","password":"123456"}'

# 2. 上报带异常的巡检数据（自动生成工单）
curl -X POST http://localhost:3000/api/inspections \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "type":"manual",
    "tunnelSectionId":"{sectionId}",
    "findings":"发现设备异响",
    "anomalyData":{
      "anomalies":[{
        "type":"设备故障",
        "category":"电气问题",
        "description":"通风机有异常噪音",
        "priority":"high"
      }]
    }
  }'

# 3. 以管理员身份查看工单列表
curl http://localhost:3000/api/work-orders \
  -H "Authorization: Bearer {admin_token}"
```

## 健康检查

```
GET http://localhost:3000/health
```

**响应:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "uptime": 3600.123
}
```

## 环境变量配置

| 变量 | 说明 | 默认值 |
|------|------|--------|
| DB_TYPE | 数据库类型 (sqlite/postgres) | sqlite |
| DB_PATH | SQLite数据库路径 | ./data/tunnel_monitor.db |
| DB_HOST | PostgreSQL主机 | localhost |
| DB_PORT | PostgreSQL端口 | 5432 |
| DB_USER | PostgreSQL用户名 | postgres |
| DB_PASSWORD | PostgreSQL密码 | postgres |
| DB_NAME | PostgreSQL数据库名 | tunnel_monitor |
| PORT | 服务端口 | 3000 |
| NODE_ENV | 运行环境 | development |
| JWT_SECRET | JWT密钥 | tunnel-monitor-secret-key-2024 |
| JWT_EXPIRES_IN | JWT过期时间 | 24h |

## 生产部署

```bash
# 1. 构建
npm run build

# 2. 初始化数据库
npm run init-db

# 3. 启动生产服务
npm start
```

## 技术栈

- **框架**: Express.js 4.x
- **语言**: TypeScript 5.x
- **数据库**: SQLite / PostgreSQL
- **ORM**: TypeORM 0.3.x
- **认证**: JWT (jsonwebtoken)
- **实时通信**: ws (WebSocket)
- **定时任务**: node-cron
- **报表导出**: ExcelJS
- **安全**: helmet, bcryptjs
- **日志**: morgan

## 常见问题

### 1. 如何重置数据库？
```bash
# 删除SQLite文件
rm -rf data/

# 重新初始化
npm run init-db
```

### 2. 如何切换到 PostgreSQL？
修改 `.env` 文件中的 `DB_TYPE=postgres`，确保 PostgreSQL 服务运行，然后执行 `npm run init-db`。

### 3. 如何添加新的传感器类型？
在 `src/entities/enums.ts` 中添加 `SensorType` 枚举值，然后在 `init-db.ts` 中添加对应的传感器和阈值配置。

### 4. 如何修改告警阈值？
可以通过调用 API `PUT /api/sensors/{sensorId}/threshold` 来更新，或者直接修改数据库中的 `sensor_thresholds` 表。

## 许可证

MIT
