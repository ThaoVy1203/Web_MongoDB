import Joi from "joi";
import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/apiError.js";

const validate = (schema) => async (req, _res, next) => {
  try {
    req.body = await schema.validateAsync(req.body, { abortEarly: false, stripUnknown: true });
    return next();
  } catch (error) {
    const message = error.details?.map((d) => d.message).join(", ") || error.message;
    return next(new ApiError(StatusCodes.BAD_REQUEST, message));
  }
};

const createTicketSchema = Joi.object({
  warrantyCode: Joi.string().trim().allow("").optional(),
  customerCode: Joi.string().trim().allow("").optional(),
  customerName: Joi.string().trim().min(2).required(),
  customerPhone: Joi.string().trim().min(6).required(),
  customerEmail: Joi.string().trim().allow("").optional(),
  customerAddress: Joi.string().trim().allow("").optional(),
  productSku: Joi.string().trim().allow("").optional(),
  productName: Joi.string().trim().min(2).required(),
  productSerial: Joi.string().trim().min(3).required(),
  category: Joi.string().trim().optional(),
  purchaseDate: Joi.alternatives().try(Joi.date(), Joi.string()).optional(),
  warrantyPeriodMonths: Joi.number().integer().min(1).max(120).optional(),
  issueCategories: Joi.array().items(Joi.string()).optional(),
  issueDescription: Joi.string().trim().min(3).required(),
  faultCategory: Joi.string().valid("screen", "power_battery", "mainboard", "other").optional(),
  pickupMode: Joi.string().valid("center", "onsite").default("center"),
  preferredTime: Joi.string().trim().allow("").optional(),
  customerDeliveryNotes: Joi.string().trim().allow("").optional(),
  borrowLaptop: Joi.boolean().default(false),
  priority: Joi.string().valid("urgent_24h", "standard_48h", "out_of_warranty").default("standard_48h"),
  attachments: Joi.array().items(Joi.object()).optional(),
});

export const ticketValidation = {
  create: validate(createTicketSchema),
};
