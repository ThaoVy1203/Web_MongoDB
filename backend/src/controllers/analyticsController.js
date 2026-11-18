import { StatusCodes } from "http-status-codes";
import { analyticsService } from "../services/analyticsService.js";
import { analyzeAddressForBranch, SERVICE_BRANCHES, TECHNICIANS } from "../services/aiBranchService.js";

const overview = async (req, res, next) => {
  try {
    const data = await analyticsService.getOverview({ range: req.query.range || "all" });
    res.status(StatusCodes.OK).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const reports = async (req, res, next) => {
  try {
    const data = await analyticsService.getAnalyticsReport(req.query);
    res.status(StatusCodes.OK).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const exportCsv = async (req, res, next) => {
  try {
    const { filename, csv } = await analyticsService.exportCsvData(req.params.type || "tickets");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(StatusCodes.OK).send(csv);
  } catch (error) {
    next(error);
  }
};

const suggestBranch = async (req, res, next) => {
  try {
    const { address = "", category = "", issueDescription = "" } = req.body || {};
    const result = analyzeAddressForBranch(address, category, issueDescription);
    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
      branches: SERVICE_BRANCHES,
      technicians: TECHNICIANS,
    });
  } catch (error) {
    next(error);
  }
};

export const analyticsController = {
  overview,
  reports,
  exportCsv,
  suggestBranch,
};
