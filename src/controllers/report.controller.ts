import { Request, Response } from "express";
import { reportService } from "../services/report.service";

class ReportController {
  async getDailyReports(req: Request, res: Response) {
    try {
      const { tunnelSectionId, startDate, endDate, page, pageSize } = req.query;
      const reports = await reportService.getDailyReports(
        tunnelSectionId as string,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        page ? parseInt(page as string) : 1,
        pageSize ? parseInt(pageSize as string) : 30
      );
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getStatistics(req: Request, res: Response) {
    try {
      const { startDate, endDate, tunnelSectionId } = req.query;
      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ message: "请提供开始日期和结束日期" });
      }
      const statistics = await reportService.getStatistics(
        new Date(startDate as string),
        new Date(endDate as string),
        tunnelSectionId as string
      );
      res.json(statistics);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async exportReport(req: Request, res: Response) {
    try {
      const { startDate, endDate, tunnelSectionId } = req.query;
      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ message: "请提供开始日期和结束日期" });
      }
      const buffer = await reportService.exportToExcel(
        new Date(startDate as string),
        new Date(endDate as string),
        tunnelSectionId as string
      );

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=运维报表_${startDate}_${endDate}.xlsx`
      );
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}

export const reportController = new ReportController();
