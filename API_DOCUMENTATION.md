# 城市地下综合管廊智能监控与运维调度系统 - API 文档

## 技术栈

- **框架**: Express.js + TypeScript
- **数据库**: PostgreSQL + TypeORM
- **实时通信**: WebSocket (ws)
- **认证**: JWT
- **定时任务**: node-cron
- **报表导出**: ExcelJS

## 项目结构

```
src/
├── app.ts                    # 应用入口
├── data-source.ts            # 数据库连接配置
├── config/
│   └── index.ts              # 系统配置
├── entities/                 # 数据库实体 (20个)
│   ├── BaseEntity.ts
│   ├── enums.ts              # 枚举定义
│   ├── User.ts
│   ├── TunnelSection.ts
│   ├── Sensor.ts
│   ├── SensorData.ts
│   ├── SensorThreshold.ts
│   ├── Alarm.ts
│   ├── EmergencyPlan.ts
│   ├── ResourceAllocation.ts
│   ├── Device.ts
│   ├── DeviceControlLog.ts
│   ├── EnergyReport.ts
│   ├── Inspection.ts
│   ├── WorkOrder.ts
│   ├── WorkOrderHistory.ts
│   ├── HiddenDanger.ts
│   ├── PipelineUnit.ts
│   ├── EntryApplication.ts
│   ├── Pipeline.ts
│   ├── EntryContract.ts
│   ├── Bill.ts
│   ├── Notification.ts
│   └── DailyReport.ts
├── services/                 # 业务服务层
│   ├── sensor.service.ts     # 传感器与告警服务
│   ├── device.service.ts     # 设备控制与能耗服务
│   ├── work-order.service.ts # 巡检与工单服务
│   ├── pipeline.service.ts   # 入廊申请与管线服务
│   ├── report.service.ts     # 报表统计服务
│   ├── notification.service.ts # 通知服务
│   ├── websocket.service.ts  # WebSocket服务
│   └── scheduler.service.ts  # 定时任务调度
├── controllers/              # 控制器层
│   ├── auth.controller.ts
│   ├── sensor.controller.ts
│   ├── device.controller.ts
│   ├── work-order.controller.ts
│   ├── pipeline.controller.ts
│   ├── report.controller.ts
│   └── notification.controller.ts
├── middleware/
│   └── auth.middleware.ts    # 认证与权限中间件
└── routes/
    └── index.ts              # 路由定义
```

## 核心功能模块

### 1. 传感器数据采集与告警模块

**API 端点**:
- `POST /api/sensors/data` - 采集传感器实时数据
- `GET /api/sensors` - 获取传感器列表
- `GET /api/sensors/:sensorId/data` - 获取传感器历史数据
- `GET /api/sensors/:sensorId/latest` - 获取传感器最新数据
- `PUT /api/sensors/:sensorId/threshold` - 更新传感器阈值
- `GET /api/alarms/active` - 获取活动告警列表
- `GET /api/alarms/history` - 获取告警历史
- `PUT /api/alarms/:alarmId/acknowledge` - 确认告警
- `PUT /api/alarms/:alarmId/resolve` - 解决告警
- `PUT /api/alarms/:alarmId/escalate` - 升级告警

**核心特性**:
- 支持温湿度、气体浓度(CH4/H2S/CO/O2)、水位、烟雾、振动等传感器
- 自动根据预设阈值触发告警（警告/告警两级）
- 根据事件类型和严重等级自动匹配应急处置预案
- 自动关联资源调配任务
- 告警超时未处理自动升级通知上级

### 2. 设备控制与能耗管理模块

**API 端点**:
- `GET /api/devices` - 获取设备列表
- `PUT /api/devices/:deviceId/control` - 手动控制设备
- `GET /api/devices/:deviceId/logs` - 获取设备控制日志
- `GET /api/energy/reports` - 获取能耗报告

**核心特性**:
- 支持通风、排水、照明、消防、水泵等设备
- 环境参数异常时自动启动设备
- 恢复正常后自动关闭设备
- 记录完整的调控日志
- 自动生成能耗统计报告

### 3. 巡检与工单管理模块

**API 端点**:
- `POST /api/inspections` - 上报巡检数据
- `POST /api/work-orders` - 创建工单
- `GET /api/work-orders` - 获取工单列表
- `PUT /api/work-orders/:workOrderId/assign` - 分配工单
- `PUT /api/work-orders/:workOrderId/start` - 开始处理
- `PUT /api/work-orders/:workOrderId/complete` - 完成处理
- `PUT /api/work-orders/:workOrderId/close` - 关闭工单
- `PUT /api/work-orders/:workOrderId/escalate` - 升级工单
- `GET /api/work-orders/:workOrderId/history` - 工单历史记录

**核心特性**:
- 支持机器人巡检和人工巡检
- 系统比对历史数据发现异常自动生成工单
- 按问题类型、位置智能分配至对应维护班组
- 工单超时未处理自动升级通知上级
- 三级升级机制：班组负责人 → 运维主管 → 运维经理

### 4. 顽固隐患识别模块

**API 端点**:
- `GET /api/hidden-dangers` - 获取顽固隐患列表
- `PUT /api/hidden-dangers/:dangerId/resolve` - 标记隐患已解决

**核心特性**:
- 自动识别重复问题
- 同一类型问题3次出现标记为顽固隐患
- 自动推送深度检查建议
- 按问题类型给出专业检查建议

### 5. 入廊申请与管线管理模块

**API 端点**:
- `POST /api/entry-applications` - 提交入廊申请
- `GET /api/entry-applications` - 获取入廊申请列表
- `PUT /api/entry-applications/:applicationId/approve` - 批准申请
- `PUT /api/entry-applications/:applicationId/reject` - 拒绝申请
- `GET /api/pipelines` - 获取管线列表
- `GET /api/pipeline-units` - 获取管线单位列表
- `GET /api/bills` - 获取账单列表
- `PUT /api/bills/:billId/pay` - 支付账单
- `GET /api/contracts` - 获取合同列表

**核心特性**:
- 根据管线类型、安全间距、空间占用自动推荐最优敷设路径
- 自动生成入廊合同
- 费用按占用长度与维护成本自动计算
- 逾期未缴费自动限制入廊并通知
- 3次逾期自动限制入廊权限

### 6. 实时推送模块

**WebSocket 端点**:
- `ws://localhost:3000/ws` - WebSocket连接

**推送主题**:
- `sensor_data` - 传感器实时数据
- `alarm_created` - 新告警生成
- `alarm_updated` - 告警状态更新
- `alarm_escalated` - 告警升级
- `device_updated` - 设备状态更新
- `work_order_created` - 新工单创建
- `work_order_assigned` - 工单分配
- `work_order_updated` - 工单状态更新
- `work_order_escalated` - 工单升级
- `hidden_danger_detected` - 顽固隐患检测
- `entry_application_created` - 新入廊申请
- `entry_application_approved` - 入廊申请批准
- `notification` - 通知消息

### 7. 报表统计模块

**API 端点**:
- `GET /api/reports/daily` - 获取日报表
- `GET /api/reports/statistics` - 获取统计数据
- `GET /api/reports/export` - 导出Excel报表

**核心特性**:
- 每日凌晨2点自动生成综合运维报表
- 统计指标：
  - 告警响应时长
  - 故障率
  - 设备能耗
  - 巡检完成率
  - 工单完成率
- 支持按廊段和时间维度筛选
- 支持导出Excel格式

### 8. 认证与通知模块

**API 端点**:
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `GET /api/auth/me` - 获取当前用户信息
- `GET /api/notifications` - 获取通知列表
- `PUT /api/notifications/:notificationId/read` - 标记通知已读
- `PUT /api/notifications/read-all` - 全部标记已读

**用户角色**:
- `admin` - 系统管理员
- `maintenance_supervisor` - 维护主管
- `maintenance_worker` - 维护人员
- `inspector` - 巡检人员
- `pipeline_unit` - 管线单位
- `command_center` - 指挥中心

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置数据库

修改 `src/data-source.ts` 中的数据库连接信息：

```typescript
export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "your_password",
  database: "tunnel_monitor",
  // ...
});
```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 构建生产版本

```bash
npm run build
npm start
```

## 定时任务

系统内置以下定时任务：

- **每5分钟**: 检查逾期工单，自动升级
- **每30分钟**: 检查逾期账单，发送提醒
- **每分钟**: 根据环境数据自动控制设备
- **每天凌晨2点**: 生成日报表和能耗统计

## 健康检查

```
GET http://localhost:3000/health
```

响应示例：
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "uptime": 3600.123
}
```
