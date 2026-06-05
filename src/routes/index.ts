import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { sensorController } from "../controllers/sensor.controller";
import { deviceController } from "../controllers/device.controller";
import { workOrderController } from "../controllers/work-order.controller";
import { pipelineController } from "../controllers/pipeline.controller";
import { reportController } from "../controllers/report.controller";
import { notificationController } from "../controllers/notification.controller";
import {
  authMiddleware,
  roleMiddleware,
} from "../middleware/auth.middleware";
import { UserRole } from "../entities/enums";

const router = Router();

router.post("/auth/login", authController.login);
router.post("/auth/register", authController.register);
router.get("/auth/me", authMiddleware, authController.getCurrentUser);

router.post(
  "/sensors/data",
  authMiddleware,
  sensorController.collectSensorData
);
router.get("/sensors", authMiddleware, sensorController.getSensors);
router.get("/sensors/:sensorId/data", authMiddleware, sensorController.getSensorData);
router.get(
  "/sensors/:sensorId/latest",
  authMiddleware,
  sensorController.getLatestSensorData
);
router.put(
  "/sensors/:sensorId/threshold",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN, UserRole.MAINTENANCE_SUPERVISOR]),
  sensorController.updateThreshold
);

router.get("/alarms/active", authMiddleware, sensorController.getActiveAlarms);
router.get("/alarms/history", authMiddleware, sensorController.getAlarmHistory);
router.put(
  "/alarms/:alarmId/acknowledge",
  authMiddleware,
  sensorController.acknowledgeAlarm
);
router.put(
  "/alarms/:alarmId/resolve",
  authMiddleware,
  sensorController.resolveAlarm
);
router.put(
  "/alarms/:alarmId/escalate",
  authMiddleware,
  sensorController.escalateAlarm
);

router.get("/devices", authMiddleware, deviceController.getDevices);
router.put(
  "/devices/:deviceId/control",
  authMiddleware,
  roleMiddleware([
    UserRole.ADMIN,
    UserRole.MAINTENANCE_SUPERVISOR,
    UserRole.MAINTENANCE_WORKER,
  ]),
  deviceController.controlDevice
);
router.get(
  "/devices/:deviceId/logs",
  authMiddleware,
  deviceController.getControlLogs
);
router.get("/energy/reports", authMiddleware, deviceController.getEnergyReports);

router.post(
  "/inspections",
  authMiddleware,
  roleMiddleware([
    UserRole.ADMIN,
    UserRole.MAINTENANCE_SUPERVISOR,
    UserRole.INSPECTOR,
  ]),
  workOrderController.createInspection
);

router.post(
  "/work-orders",
  authMiddleware,
  workOrderController.createWorkOrder
);
router.get("/work-orders", authMiddleware, workOrderController.getWorkOrders);
router.put(
  "/work-orders/:workOrderId/assign",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN, UserRole.MAINTENANCE_SUPERVISOR]),
  workOrderController.assignWorkOrder
);
router.put(
  "/work-orders/:workOrderId/start",
  authMiddleware,
  workOrderController.startWorkOrder
);
router.put(
  "/work-orders/:workOrderId/complete",
  authMiddleware,
  workOrderController.completeWorkOrder
);
router.put(
  "/work-orders/:workOrderId/close",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN, UserRole.MAINTENANCE_SUPERVISOR]),
  workOrderController.closeWorkOrder
);
router.put(
  "/work-orders/:workOrderId/escalate",
  authMiddleware,
  workOrderController.escalateWorkOrder
);
router.get(
  "/work-orders/:workOrderId/history",
  authMiddleware,
  workOrderController.getWorkOrderHistory
);

router.get(
  "/hidden-dangers",
  authMiddleware,
  workOrderController.getHiddenDangers
);
router.put(
  "/hidden-dangers/:dangerId/resolve",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN, UserRole.MAINTENANCE_SUPERVISOR]),
  workOrderController.resolveHiddenDanger
);

router.post(
  "/entry-applications",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN, UserRole.PIPELINE_UNIT]),
  pipelineController.createApplication
);
router.get(
  "/entry-applications",
  authMiddleware,
  pipelineController.getApplications
);
router.put(
  "/entry-applications/:applicationId/approve",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN]),
  pipelineController.approveApplication
);
router.put(
  "/entry-applications/:applicationId/reject",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN]),
  pipelineController.rejectApplication
);

router.get("/pipelines", authMiddleware, pipelineController.getPipelines);
router.get("/pipeline-units", authMiddleware, pipelineController.getPipelineUnits);

router.get("/bills", authMiddleware, pipelineController.getBills);
router.put("/bills/:billId/pay", authMiddleware, pipelineController.payBill);

router.get("/contracts", authMiddleware, pipelineController.getContracts);

router.get("/reports/daily", authMiddleware, reportController.getDailyReports);
router.get("/reports/statistics", authMiddleware, reportController.getStatistics);
router.get("/reports/export", authMiddleware, reportController.exportReport);

router.get(
  "/notifications",
  authMiddleware,
  notificationController.getUserNotifications
);
router.put(
  "/notifications/:notificationId/read",
  authMiddleware,
  notificationController.markAsRead
);
router.put(
  "/notifications/read-all",
  authMiddleware,
  notificationController.markAllAsRead
);

export default router;
