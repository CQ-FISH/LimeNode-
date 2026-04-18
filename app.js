const express = require('express');
const session = require('express-session');
const path = require('path');
const hbs = require('handlebars');
const fs = require('fs');
const app = express();

// 导入数据库和路由
const db = require('./db/database');
const authMiddleware = require('./middleware/auth');

// 导入路由
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const productRouter = require('./routes/product');
const cartRouter = require('./routes/cart');
const orderRouter = require('./routes/order');
const serviceRouter = require('./routes/service');
const networkRouter = require('./routes/network');
const securityRouter = require('./routes/security');

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session 配置
app.use(session({
  secret: 'limenode-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24小时
    httpOnly: true
  }
}));

// 注册 Handlebars 辅助函数
hbs.registerHelper('eq', function(a, b) {
  return a === b;
});

hbs.registerHelper('gt', function(a, b) {
  return a > b;
});

hbs.registerHelper('multiply', function(a, b) {
  return (a * b).toFixed(2);
});

// 注册 Handlebars partials
const partialsDir = path.join(__dirname, 'views', 'partials');
fs.readdirSync(partialsDir).forEach(file => {
  if (file.endsWith('.html')) {
    const partialName = path.basename(file, '.html');
    const partialPath = path.join(partialsDir, file);
    const partialContent = fs.readFileSync(partialPath, 'utf8');
    hbs.registerPartial(partialName, partialContent);
  }
});

// 视图引擎配置 - 使用 Handlebars
app.engine('html', function(filePath, options, callback) {
  fs.readFile(filePath, 'utf8', function(err, content) {
    if (err) return callback(err);
    const template = hbs.compile(content);
    const output = template(options);
    return callback(null, output);
  });
});

app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

// 全局中间件 - 传递用户信息到视图
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.path = req.path;
  res.locals.cartCount = 0;
  next();
});

// 路由配置
app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/user', authMiddleware.requireLogin, userRouter);
app.use('/product', productRouter);
app.use('/cart', authMiddleware.requireLogin, cartRouter);
app.use('/order', authMiddleware.requireLogin, orderRouter);
app.use('/service', authMiddleware.requireLogin, serviceRouter);
app.use('/network', authMiddleware.requireLogin, networkRouter);
app.use('/security', authMiddleware.requireLogin, securityRouter);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

// 404 处理
app.use((req, res) => {
  res.status(404).render('404', { title: '页面未找到' });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`LimeNode 清柠云控制台已启动: http://localhost:${PORT}`);
  console.log(`粉色二次元极简风格云服务控制台`);
});

module.exports = app;
