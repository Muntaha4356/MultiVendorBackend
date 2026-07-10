import ErrorHandler from "./ErrorHandler.js";

export const parseNonNegativeNumber = (value, fieldName, { allowZero = true } = {}) => {
  const parsed = Number(value);
  if (isNaN(parsed) || parsed < 0 || (!allowZero && parsed === 0)) {
    throw new ErrorHandler(`${fieldName} must be a valid non-negative number`, 400);
  }
  return parsed;
};

export const validateProductPayload = (body, files) => {
  if (!files?.length) {
    throw new ErrorHandler("At least one product image is required", 400);
  }

  if (!body.category || body.category === "Choose a Category") {
    throw new ErrorHandler("Please select a product category", 400);
  }

  return {
    discountPrice: parseNonNegativeNumber(body.discountPrice, "Discount price"),
    stock: parseNonNegativeNumber(body.stock, "Stock"),
    originalPrice: body.originalPrice
      ? parseNonNegativeNumber(body.originalPrice, "Original price")
      : 0,
  };
};

export const validateEventPayload = (body, files) => {
  if (!files?.length) {
    throw new ErrorHandler("At least one event image is required", 400);
  }

  if (!body.category || body.category === "Choose a Category") {
    throw new ErrorHandler("Please select an event category", 400);
  }

  const startDate = new Date(body.start_Date);
  const finishDate = new Date(body.Finish_Date);

  if (isNaN(startDate.getTime()) || isNaN(finishDate.getTime())) {
    throw new ErrorHandler("Please provide valid event dates", 400);
  }

  if (finishDate <= startDate) {
    throw new ErrorHandler("Event end date must be after start date", 400);
  }

  return {
    discountPrice: parseNonNegativeNumber(body.discountPrice, "Discount price"),
    stock: parseNonNegativeNumber(body.stock, "Stock"),
    originalPrice: body.originalPrice
      ? parseNonNegativeNumber(body.originalPrice, "Original price")
      : 0,
    start_Date: startDate,
    Finish_Date: finishDate,
  };
};

export const getCloudinaryPublicId = (imageUrl) => {
  const uploadIndex = imageUrl.indexOf("/upload/");
  if (uploadIndex === -1) return null;

  const pathAfterUpload = imageUrl.substring(uploadIndex + 8).replace(/^v\d+\//, "");
  const lastDot = pathAfterUpload.lastIndexOf(".");

  return lastDot === -1 ? pathAfterUpload : pathAfterUpload.substring(0, lastDot);
};
