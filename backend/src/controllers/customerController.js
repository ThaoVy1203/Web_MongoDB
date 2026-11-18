import { StatusCodes } from "http-status-codes";
import { customerService } from "../services/customerService.js";

const list = async (req, res, next) => {
  try {
    const result = await customerService.listCustomers(req.query);
    res.status(StatusCodes.OK).json({
      success: true,
      data: result.customers,
      total: result.total,
    });
  } catch (error) {
    next(error);
  }
};

const detail = async (req, res, next) => {
  try {
    const customer = await customerService.getCustomerDetail(req.params.id);
    res.status(StatusCodes.OK).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const created = await customerService.createCustomer(req.body);
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: `Đã tạo hồ sơ khách hàng ${created.customerCode}!`,
      data: created,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const updated = await customerService.updateCustomer(req.params.id, req.body);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Đã lưu hồ sơ khách hàng!",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const toggleLock = async (req, res, next) => {
  try {
    const updated = await customerService.toggleLockCustomer(req.params.id);
    res.status(StatusCodes.OK).json({
      success: true,
      message: updated.status === "locked" ? "Đã tạm khóa hồ sơ khách hàng." : "Đã mở khóa hồ sơ khách hàng.",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const addNote = async (req, res, next) => {
  try {
    const author = req.user?.fullname || "Chuyên viên CSKH";
    const updated = await customerService.addCustomerNote(req.params.id, req.body, author);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Đã lưu ghi chú chăm sóc khách hàng!",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const customerController = {
  list,
  detail,
  create,
  update,
  toggleLock,
  addNote,
};
