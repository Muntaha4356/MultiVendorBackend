//  Create Token and Save it in cookies
const sendShopToken = (seller, statusCode, res) => {
  const token = seller.getJwtToken(); //defined inside the model scema
  //Option for cookies
  const options = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 * 24 * 60 * 60 * 1000 → 90 days converted to milliseconds.
    httpOnly: true, // Means the cookie cannot be accessed from JavaScript (document.cookie).
    sameSite: "lax", // Allows the cookie to be sent cross-site (important when your frontend and backend run on different domains).
    secure: false, // Cookie will only be sent over HTTPS connections.
  };
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