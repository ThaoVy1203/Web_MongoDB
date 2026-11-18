import Joi from "joi";
import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/apiError.js";

const validate = (schema) => async (req, _res, next) => {
  try {
    req.body = await schema.validateAsync(req.body || {}, { abortEarly: false, stripUnknown: true });
    return next();
  } catch (error) {
    const message = error.details?.map((d) => d.message).join(", ") || error.message;
    return next(new ApiError(StatusCodes.BAD_REQUEST, message));
  }
};

const createTicketSchema = Joi.object({
  warrantyCode: Joi.string().trim().allow("").optional(),
  customerCode: Joi.string().trim().allow("").optional(),
  customerName: Joi.string().trim().min(2).required().messages({
    "string.min": "Họ tên khách hàng cần tối thiểu 2 ký tự.",
    "any.required": "Vui lòng nhập họ tên khách hàng.",
  }),
  customerPhone: Joi.string().trim().min(6).required().messages({
    "string.min": "Số điện thoại cần tối thiểu 6 ký tự.",
    "any.required": "Vui lòng nhập số điện thoại liên hệ.",
  }),
  customerEmail: Joi.string().trim().allow("").optional(),
  customerAddress: Joi.string().trim().allow("").optional(),
  productSku: Joi.string().trim().allow("").optional(),
  productName: Joi.string().trim().min(2).required().messages({
    "string.min": "Tên sản phẩm cần tối thiểu 2 ký tự.",
    "any.required": "Vui lòng nhập tên sản phẩm.",
  }),
  productSerial: Joi.string().trim().min(3).required().messages({
    "string.min": "Số Serial/IMEI cần tối thiểu 3 ký tự.",
    "any.required": "Vui lòng nhập số Serial/IMEI.",
  }),
  category: Joi.string().trim().allow("").optional(),
  purchaseDate: Joi.date().iso().allow("", null).optional(),
  warrantyPeriodMonths: Joi.number().integer().min(1).max(120).optional(),
  issueCategories: Joi.array().items(Joi.string()).optional(),
  issueDescription: Joi.string().trim().min(3).required().messages({
    "string.min": "Mô tả tình trạng lỗi cần tối thiểu 3 ký tự.",
    "any.required": "Vui lòng nhập mô tả tình trạng lỗi.",
  }),
  faultCategory: Joi.string().valid("screen", "power_battery", "mainboard", "other").optional(),
  pickupMode: Joi.string().valid("center", "onsite").default("center"),
  preferredTime: Joi.string().trim().allow("").optional(),
  customerDeliveryNotes: Joi.string().trim().allow("").optional(),
  borrowLaptop: Joi.boolean().default(false),
  priority: Joi.string().valid("urgent_24h", "standard_48h", "out_of_warranty").default("standard_48h"),
  preferredBranchCode: Joi.string().trim().allow("").optional(),
  attachments: Joi.array()
    .items(
      Joi.object({
        filename: Joi.string().trim().min(1).required(),
        fileType: Joi.string().trim().optional(),
        sizeLabel: Joi.string().trim().optional(),
        url: Joi.string().trim().allow("").optional(),
      })
    )
    .optional(),
});

export const ticketValidation = {
  create: validate(createTicketSchema),
};
