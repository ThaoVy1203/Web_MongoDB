import { StatusCodes } from "http-status-codes";
import { recordService } from "../services/recordService.js";

const list = async (req, res, next) => {
  try {
    const { status = "all", q = "", mine } = req.query;
    const scope =
      mine === "true" && req.user && req.user.role === "customer"
        ? { customerCode: req.user.customerCode, email: req.user.email }
        : {};
    const result = await recordService.listRecords({ status, q, ...scope });
    res.status(StatusCodes.OK).json({
      success: true,
      data: result.records,
      counts: result.counts,
    });
  } catch (error) {
    next(error);
  }
};

const lookup = async (req, res, next) => {
  try {
    const query = req.query.q || req.query.serial || req.query.code || "";
    const device = await recordService.lookupDevice(query);
    res.status(StatusCodes.OK).json({
      success: true,
      found: Boolean(device),
      data: device,
    });
  } catch (error) {
    next(error);
  }
};

const batchCheck = async (req, res, next) => {
  try {
    const results = await recordService.batchCheckSerials(req.body.serials || "");
    res.status(StatusCodes.OK).json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

const detail = async (req, res, next) => {
  try {
    const record = await recordService.getRecordDetail(req.params.id);
    res.status(StatusCodes.OK).json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const created = await recordService.createRecord(req.body, req.user);
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: `Đã cấp chứng nhận bảo hành số ${created.wbCode}!`,
      data: created,
    });
  } catch (error) {
    next(error);
  }
};

const renew = async (req, res, next) => {
  try {
    const updated = await recordService.renewRecord(req.params.id, req.body);
    res.status(StatusCodes.OK).json({
      success: true,
      message: `Đã gia hạn chứng nhận ${updated.wbCode} thành công!`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const updated = await recordService.updateRecord(req.params.id, req.body);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Cập nhật hồ sơ chứng nhận thành công!",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await recordService.deleteRecord(req.params.id);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Đã xóa hồ sơ chứng nhận bảo hành.",
    });
  } catch (error) {
    next(error);
  }
};

export const recordController = {
  list,
  lookup,
  batchCheck,
  detail,
  create,
  renew,
  update,
  remove,
};
