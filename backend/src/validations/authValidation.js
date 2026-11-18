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

const loginSchema = Joi.object({
  identifier: Joi.string().trim().optional(),
  email: Joi.string().trim().optional(),
  password: Joi.string().min(4).max(64).required(),
}).or("identifier", "email");

const registerSchema = Joi.object({
  fullname: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().required(),
  phone: Joi.string().trim().allow("").optional(),
  password: Joi.string().min(6).max(64).required(),
});

export const authValidation = {
  login: validate(loginSchema),
  register: validate(registerSchema),
};
