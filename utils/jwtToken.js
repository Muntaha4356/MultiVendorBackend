import { getCookieOptions } from "./cookieOptions.js";

//  Create Token and Save it in cookies
const sendToken = (user, statusCode, res) => {
  const token = user.getJwtToken(); //defined inside the model scema
  const options = getCookieOptions();
  res.status(statusCode)
  .cookie("token", token, options).json({
    //Cookie name = "token".
    // Cookie value = the JWT you generated.
    // Cookie options = the secure settings you defined.
    success: true,
    user,
    token,
  });
};

export default sendToken;
