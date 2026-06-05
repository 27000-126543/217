import { Request, Response } from "express";
import { pipelineService } from "../services/pipeline.service";
import {
  EntryApplicationStatus,
  PipelineType,
  BillStatus,
} from "../entities/enums";

class PipelineController {
  async createApplication(req: any, res: Response) {
    try {
      const data = req.body;
      const application = await pipelineService.createEntryApplication(data);
      res.status(201).json(application);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getApplications(req: Request, res: Response) {
    try {
      const { status, pipelineUnitId, pipelineType, page, pageSize } =
        req.query;
      const applications = await pipelineService.getApplications(
        {
          status: status as EntryApplicationStatus,
          pipelineUnitId: pipelineUnitId as string,
          pipelineType: pipelineType as PipelineType,
        },
        page ? parseInt(page as string) : 1,
        pageSize ? parseInt(pageSize as string) : 20
      );
      res.json(applications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async approveApplication(req: any, res: Response) {
    try {
      const { applicationId } = req.params;
      const application = await pipelineService.approveApplication(
        applicationId,
        req.user.id
      );
      res.json(application);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async rejectApplication(req: any, res: Response) {
    try {
      const { applicationId } = req.params;
      const { reason } = req.body;
      const application = await pipelineService.rejectApplication(
        applicationId,
        reason,
        req.user.id
      );
      res.json(application);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getPipelines(req: Request, res: Response) {
    try {
      const { tunnelSectionId, pipelineUnitId } = req.query;
      const pipelines = await pipelineService.getPipelines(
        tunnelSectionId as string,
        pipelineUnitId as string
      );
      res.json(pipelines);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getPipelineUnits(req: Request, res: Response) {
    try {
      const units = await pipelineService.getPipelineUnits();
      res.json(units);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getBills(req: Request, res: Response) {
    try {
      const { pipelineUnitId, status, page, pageSize } = req.query;
      const bills = await pipelineService.getBills(
        {
          pipelineUnitId: pipelineUnitId as string,
          status: status as BillStatus,
        },
        page ? parseInt(page as string) : 1,
        pageSize ? parseInt(pageSize as string) : 20
      );
      res.json(bills);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async payBill(req: Request, res: Response) {
    try {
      const { billId } = req.params;
      const bill = await pipelineService.payBill(billId);
      res.json(bill);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getContracts(req: Request, res: Response) {
    try {
      const { applicationId } = req.query;
      const contracts = await pipelineService.getContracts(
        applicationId as string
      );
      res.json(contracts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}

export const pipelineController = new PipelineController();
