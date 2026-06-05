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

const bind = (obj: any, method: string) => obj[method].bind(obj);

router.post("/auth/login", bind(authController, "login"));
router.post("/auth/register", bind(authController, "register"));
router.get("/auth/me", authMiddleware, bind(authController, "getCurrentUser"));

router.post(
  "/sensors/data",
  authMiddleware,
  bind(sensorController, "collectSensorData")
);
router.get("/sensors", authMiddleware, bind(sensorController, "getSensors"));
router.get("/sensors/:sensorId/data", authMiddleware, bind(sensorController, "getSensorData"));
router.get(
  "/sensors/:sensorId/latest",
  authMiddleware,
  bind(sensorController, "getLatestSensorData")
);
router.put(
  "/sensors/:sensorId/threshold",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN, UserRole.MAINTENANCE_SUPERVISOR]),
  bind(sensorController, "updateThreshold")
);

router.get("/alarms/active", authMiddleware, bind(sensorController, "getActiveAlarms"));
router.get("/alarms/history", authMiddleware, bind(sensorController, "getAlarmHistory"));
router.put(
  "/alarms/:alarmId/acknowledge",
  authMiddleware,
  bind(sensorController, "acknowledgeAlarm")
);
router.put(
  "/alarms/:alarmId/resolve",
  authMiddleware,
  bind(sensorController, "resolveAlarm")
);
router.put(
  "/alarms/:alarmId/escalate",
  authMiddleware,
  bind(sensorController, "escalateAlarm")
);

router.get("/devices", authMiddleware, bind(deviceController, "getDevices"));
router.put(
  "/devices/:deviceId/control",
  authMiddleware,
  roleMiddleware([
    UserRole.ADMIN,
    UserRole.MAINTENANCE_SUPERVISOR,
    UserRole.MAINTENANCE_WORKER,
  ]),
  bind(deviceController, "controlDevice")
);
router.get(
  "/devices/:deviceId/logs",
  authMiddleware,
  bind(deviceController, "getControlLogs")
);
router.get("/energy/reports", authMiddleware, bind(deviceController, "getEnergyReports"));

router.post(
  "/inspections",
  authMiddleware,
  roleMiddleware([
    UserRole.ADMIN,
    UserRole.MAINTENANCE_SUPERVISOR,
    UserRole.INSPECTOR,
  ]),
  bind(workOrderController, "createInspection")
);

router.post(
  "/work-orders",
  authMiddleware,
  bind(workOrderController, "createWorkOrder")
);
router.get("/work-orders", authMiddleware, bind(workOrderController, "getWorkOrders"));
router.put(
  "/work-orders/:workOrderId/assign",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN, UserRole.MAINTENANCE_SUPERVISOR]),
  bind(workOrderController, "assignWorkOrder")
);
router.put(
  "/work-orders/:workOrderId/start",
  authMiddleware,
  bind(workOrderController, "startWorkOrder")
);
router.put(
  "/work-orders/:workOrderId/complete",
  authMiddleware,
  bind(workOrderController, "completeWorkOrder")
);
router.put(
  "/work-orders/:workOrderId/close",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN, UserRole.MAINTENANCE_SUPERVISOR]),
  bind(workOrderController, "closeWorkOrder")
);
router.put(
  "/work-orders/:workOrderId/escalate",
  authMiddleware,
  bind(workOrderController, "escalateWorkOrder")
);
router.get(
  "/work-orders/:workOrderId/history",
  authMiddleware,
  bind(workOrderController, "getWorkOrderHistory")
);

router.get(
  "/hidden-dangers",
  authMiddleware,
  bind(workOrderController, "getHiddenDangers")
);
router.put(
  "/hidden-dangers/:dangerId/resolve",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN, UserRole.MAINTENANCE_SUPERVISOR]),
  bind(workOrderController, "resolveHiddenDanger")
);

router.post(
  "/entry-applications",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN, UserRole.PIPELINE_UNIT]),
  bind(pipelineController, "createApplication")
);
router.get(
  "/entry-applications",
  authMiddleware,
  bind(pipelineController, "getApplications")
);
router.put(
  "/entry-applications/:applicationId/approve",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN]),
  bind(pipelineController, "approveApplication")
);
router.put(
  "/entry-applications/:applicationId/reject",
  authMiddleware,
  roleMiddleware([UserRole.ADMIN]),
  bind(pipelineController, "rejectApplication")
);

router.get("/pipelines", authMiddleware, bind(pipelineController, "getPipelines"));
router.get("/pipeline-units", authMiddleware, bind(pipelineController, "getPipelineUnits"));

router.get("/bills", authMiddleware, bind(pipelineController, "getBills"));
router.put("/bills/:billId/pay", authMiddleware, bind(pipelineController, "payBill"));

router.get("/contracts", authMiddleware, bind(pipelineController, "getContracts"));

router.get("/reports/daily", authMiddleware, bind(reportController, "getDailyReports"));
router.get("/reports/statistics", authMiddleware, bind(reportController, "getStatistics"));
router.get("/reports/export", authMiddleware, bind(reportController, "exportReport"));

router.get(
  "/notifications",
  authMiddleware,
  bind(notificationController, "getUserNotifications")
);
router.put(
  "/notifications/:notificationId/read",
  authMiddleware,
  bind(notificationController, "markAsRead")
);
router.put(
  "/notifications/read-all",
  authMiddleware,
  bind(notificationController, "markAllAsRead")
);

export default router;
