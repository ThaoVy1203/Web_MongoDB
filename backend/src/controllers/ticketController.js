import { StatusCodes } from "http-status-codes";
import { ticketService } from "../services/ticketService.js";

const list = async (req, res, next) => {
  try {
    const result = await ticketService.listTickets(req.query);
    res.status(StatusCodes.OK).json({
      success: true,
      data: result.tickets,
      queueCounts: result.queueCounts,
      branches: result.branches,
      technicians: result.technicians,
    });
  } catch (error) {
    next(error);
  }
};

const detail = async (req, res, next) => {
  try {
    const ticket = await ticketService.getTicketDetail(req.params.id);
    res.status(StatusCodes.OK).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const created = await ticketService.createTicket(req.body, req.user);
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: `Đã khởi tạo phiếu bảo hành #${created.warrantyCode}!`,
      data: created,
    });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const updated = await ticketService.updateTicketStatus(req.params.id, req.body);
    res.status(StatusCodes.OK).json({
      success: true,
      message: `Đã cập nhật phiếu #${updated.warrantyCode} sang "${updated.status}"!`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const assign = async (req, res, next) => {
  try {
    const updated = await ticketService.assignTicket(req.params.id, req.body);
    res.status(StatusCodes.OK).json({
      success: true,
      message: `Đã điều phối phiếu #${updated.warrantyCode} thành công!`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const addPart = async (req, res, next) => {
  try {
    const updated = await ticketService.addTicketPart(req.params.id, req.body);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Đã ghi nhận xuất kho linh kiện!",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const reject = async (req, res, next) => {
  try {
    const updated = await ticketService.rejectTicket(req.params.id, req.body);
    res.status(StatusCodes.OK).json({
      success: true,
      message: `Đã ghi nhận biên bản từ chối cho phiếu #${updated.warrantyCode}.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const confirmReceipt = async (req, res, next) => {
  try {
    const updated = await ticketService.confirmReceipt(req.params.id);
    res.status(StatusCodes.OK).json({
      success: true,
      message: `Nghiệm thu bàn giao hoàn tất cho phiếu #${updated.warrantyCode}!`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const addMessage = async (req, res, next) => {
  try {
    const updated = await ticketService.addMessage(req.params.id, req.body, req.user);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Đã gửi phản hồi trực tuyến!",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await ticketService.deleteTicket(req.params.id);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Đã xóa phiếu bảo hành khỏi hệ thống.",
    });
  } catch (error) {
    next(error);
  }
};

export const ticketController = {
  list,
  detail,
  create,
  updateStatus,
  assign,
  addPart,
  reject,
  confirmReceipt,
  addMessage,
  remove,
};
