import { StatusCodes } from "http-status-codes";
import { analyticsService } from "../services/analyticsService.js";
import {
  analyzeAddressForBranch,
  buildExpiringSmartAdvice,
  parseUserCoords,
  SERVICE_BRANCHES,
  TECHNICIANS,
} from "../services/aiBranchService.js";
import { WarrantyRecord } from "../models/warrantyRecordModel.js";
import { decorateRecord } from "../utils/formatters.js";
import { getDeviceWarrantyInsights } from "../services/deviceIntelService.js";

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
    const { address = "", category = "", issueDescription = "", lat, lng } = req.body || {};
    const userCoords = parseUserCoords(lat, lng);
    const result = analyzeAddressForBranch(address, category, issueDescription, userCoords);
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

const expiringAdvisor = async (req, res, next) => {
  try {
    const lat = req.body?.lat ?? req.query?.lat;
    const lng = req.body?.lng ?? req.query?.lng;
    const userCoords = parseUserCoords(lat, lng);

    const rawRecords = await WarrantyRecord.find({}).sort({ endDate: 1 });
    const decorated = rawRecords.map(decorateRecord);
    const advice = buildExpiringSmartAdvice(decorated, userCoords);

    res.status(StatusCodes.OK).json({
      success: true,
      data: advice,
    });
  } catch (error) {
    next(error);
  }
};

const deviceInsights = async (req, res, next) => {
  try {
    const {
      deviceName = "",
      category = "",
      timeframeMonths = 12,
      forceRefresh = false,
    } = req.body || {};
    const data = await getDeviceWarrantyInsights({
      deviceName,
      category,
      timeframeMonths,
      forceRefresh: Boolean(forceRefresh),
    });
    res.status(StatusCodes.OK).json({
      success: true,
      data,
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
  expiringAdvisor,
  deviceInsights,
};
