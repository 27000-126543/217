import { Request, Response } from "express";
import { workOrderService } from "../services/work-order.service";
import {
  WorkOrderStatus,
  WorkOrderPriority,
  InspectionType,
} from "../entities/enums";

class WorkOrderController {
  async createInspection(req: any, res: Response) {
    try {
      const data = req.body;
      const inspection = await workOrderService.createInspection({
        ...data,
        inspectorId: req.user?.id || data.inspectorId,
      });
      res.status(201).json(inspection);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async createWorkOrder(req: any, res: Response) {
    try {
      const data = req.body;
      const workOrder = await workOrderService.createWorkOrder({
        ...data,
        creatorId: req.user?.id,
      });
      res.status(201).json(workOrder);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async assignWorkOrder(req: any, res: Response) {
    try {
      const { workOrderId } = req.params;
      const { assigneeId } = req.body;
      const workOrder = await workOrderService.assignWorkOrder(
        workOrderId,
        assigneeId,
        req.user?.id
      );
      res.json(workOrder);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async startWorkOrder(req: any, res: Response) {
    try {
      const { workOrderId } = req.params;
      const workOrder = await workOrderService.startWorkOrder(
        workOrderId,
        req.user.id
      );
      res.json(workOrder);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async completeWorkOrder(req: any, res: Response) {
    try {
      const { workOrderId } = req.params;
      const { resolution, resolutionImages } = req.body;
      const workOrder = await workOrderService.completeWorkOrder(
        workOrderId,
        resolution,
        resolutionImages,
        req.user.id
      );
      res.json(workOrder);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async closeWorkOrder(req: any, res: Response) {
    try {
      const { workOrderId } = req.params;
      const { remark } = req.body;
      const workOrder = await workOrderService.closeWorkOrder(
        workOrderId,
        req.user.id,
        remark
      );
      res.json(workOrder);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async escalateWorkOrder(req: any, res: Response) {
    try {
      const { workOrderId } = req.params;
      const workOrder = await workOrderService.escalateWorkOrder(
        workOrderId,
        req.user?.id
      );
      res.json(workOrder);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getWorkOrders(req: Request, res: Response) {
    try {
      const {
        status,
        priority,
        assigneeId,
        tunnelSectionId,
        isRecurring,
        page,
        pageSize,
      } = req.query;
      const orders = await workOrderService.getWorkOrders(
        {
          status: status as WorkOrderStatus,
          priority: priority as WorkOrderPriority,
          assigneeId: assigneeId as string,
          tunnelSectionId: tunnelSectionId as string,
          isRecurring: isRecurring ? isRecurring === "true" : undefined,
        },
        page ? parseInt(page as string) : 1,
        pageSize ? parseInt(pageSize as string) : 20
      );
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getWorkOrderHistory(req: Request, res: Response) {
    try {
      const { workOrderId } = req.params;
      const history = await workOrderService.getWorkOrderHistory(workOrderId);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getHiddenDangers(req: Request, res: Response) {
    try {
      const { tunnelSectionId, isResolved, page, pageSize } = req.query;
      const dangers = await workOrderService.getHiddenDangers(
        {
          tunnelSectionId: tunnelSectionId as string,
          isResolved: isResolved ? isResolved === "true" : undefined,
        },
        page ? parseInt(page as string) : 1,
        pageSize ? parseInt(pageSize as string) : 20
      );
      res.json(dangers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async resolveHiddenDanger(req: any, res: Response) {
    try {
      const { dangerId } = req.params;
      const { resolution } = req.body;
      const danger = await workOrderService.resolveHiddenDanger(
        dangerId,
        req.user.id,
        resolution
      );
      res.json(danger);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}

export const workOrderController = new WorkOrderController();
