import { getCookieOptions } from "./cookieOptions.js";

//  Create Token and Save it in cookies
const sendShopToken = (seller, statusCode, res) => {
  const token = seller.getJwtToken(); //defined inside the model scema
  const options = getCookieOptions();
  res.status(statusCode)
  .cookie("seller_token", token, options).json({
    //Cookie name = "token".
    // Cookie value = the JWT you generated.
    // Cookie options = the secure settings you defined.
    success: true,
    seller,
    token,
  });
};

export default sendShopToken;