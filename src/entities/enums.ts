export enum UserRole {
  ADMIN = "admin",
  MAINTENANCE_SUPERVISOR = "maintenance_supervisor",
  MAINTENANCE_WORKER = "maintenance_worker",
  INSPECTOR = "inspector",
  PIPELINE_UNIT = "pipeline_unit",
  COMMAND_CENTER = "command_center",
}

export enum SensorType {
  TEMPERATURE = "temperature",
  HUMIDITY = "humidity",
  GAS_CH4 = "gas_ch4",
  GAS_H2S = "gas_h2s",
  GAS_CO = "gas_co",
  GAS_O2 = "gas_o2",
  WATER_LEVEL = "water_level",
  SMOKE = "smoke",
  VIBRATION = "vibration",
}

export enum SensorStatus {
  NORMAL = "normal",
  WARNING = "warning",
  ALARM = "alarm",
  OFFLINE = "offline",
}

export enum AlarmLevel {
  MINOR = "minor",
  MAJOR = "major",
  CRITICAL = "critical",
}

export enum AlarmStatus {
  PENDING = "pending",
  ACKNOWLEDGED = "acknowledged",
  PROCESSING = "processing",
  RESOLVED = "resolved",
  ESCALATED = "escalated",
}

export enum DeviceType {
  VENTILATION = "ventilation",
  DRAINAGE = "drainage",
  LIGHTING = "lighting",
  FIRE_SUPPRESSION = "fire_suppression",
  PUMP = "pump",
}

export enum DeviceStatus {
  ON = "on",
  OFF = "off",
  FAULT = "fault",
  MAINTENANCE = "maintenance",
}

export enum WorkOrderStatus {
  CREATED = "created",
  ASSIGNED = "assigned",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CLOSED = "closed",
  ESCALATED = "escalated",
  OVERDUE = "overdue",
}

export enum WorkOrderPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export enum InspectionType {
  ROBOT = "robot",
  MANUAL = "manual",
}

export enum EntryApplicationStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}

export enum BillStatus {
  UNPAID = "unpaid",
  PAID = "paid",
  OVERDUE = "overdue",
  CANCELLED = "cancelled",
}

export enum PipelineType {
  WATER_SUPPLY = "water_supply",
  DRAINAGE = "drainage",
  ELECTRIC = "electric",
  GAS = "gas",
  HEAT = "heat",
  COMMUNICATION = "communication",
}

export enum NotificationType {
  ALARM = "alarm",
  WORK_ORDER = "work_order",
  DEVICE = "device",
  ENTRY_APPLICATION = "entry_application",
  SYSTEM = "system",
}
