/**
 * 认证中间件
 * 用于验证用户登录状态和保护路由
 */

// 验证是否已登录
function requireLogin(req, res, next) {
  if (!req.session.user) {
    // AJAX 请求返回 JSON
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }
    // 普通请求重定向到登录页
    return res.redirect('/auth/login?redirect=' + encodeURIComponent(req.originalUrl));
  }
  next();
}

// 验证是否未登录（用于登录/注册页面）
function requireGuest(req, res, next) {
  if (req.session.user) {
    return res.redirect('/');
  }
  next();
}

module.exports = {
  requireLogin,
  requireGuest
};
