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

const createRecordSchema = Joi.object({
  wbCode: Joi.string().trim().allow("").optional(),
  serialNumber: Joi.string().trim().min(3).required(),
  imei: Joi.string().trim().allow("").optional(),
  productSku: Joi.string().trim().allow("").optional(),
  productName: Joi.string().trim().min(2).required(),
  category: Joi.string().trim().allow("").optional(),
  origin: Joi.string().trim().allow("").optional(),
  customerCode: Joi.string().trim().allow("").optional(),
  customerName: Joi.string().trim().allow("").optional(),
  customerPhone: Joi.string().trim().allow("").optional(),
  customerEmail: Joi.string().trim().allow("").optional(),
  customerAddress: Joi.string().trim().allow("").optional(),
  purchaseDate: Joi.alternatives().try(Joi.date(), Joi.string()).optional(),
  periodMonths: Joi.number().integer().min(1).max(120).default(12),
  packageName: Joi.string().trim().allow("").optional(),
  purchasePlace: Joi.string().trim().allow("").optional(),
  activationChannel: Joi.string().valid("QR", "API", "WEB", "ADMIN").default("WEB"),
  notes: Joi.string().trim().allow("").optional(),
  image: Joi.string().trim().allow("").optional(),
});

const renewSchema = Joi.object({
  months: Joi.number().integer().min(1).max(60).default(12),
  note: Joi.string().trim().allow("").optional(),
});

export const recordValidation = {
  create: validate(createRecordSchema),
  renew: validate(renewSchema),
};
