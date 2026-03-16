"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAuthCookies = setAuthCookies;
exports.clearAuthCookies = clearAuthCookies;
function setAuthCookies(res, accessToken, refreshToken) {
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
    });
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
    });
}
function clearAuthCookies(res) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
}
//# sourceMappingURL=cookies.js.map