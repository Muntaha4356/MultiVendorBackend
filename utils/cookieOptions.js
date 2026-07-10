const isDeployed =
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL === "1" ||
  (process.env.CLIENT_URL && !process.env.CLIENT_URL.includes("localhost"));

export const getCookieOptions = () => ({
  expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  httpOnly: true,
  sameSite: isDeployed ? "none" : "lax",
  secure: isDeployed,
});

export const getClearCookieOptions = () => ({
  expires: new Date(Date.now()),
  httpOnly: true,
  sameSite: isDeployed ? "none" : "lax",
  secure: isDeployed,
});
