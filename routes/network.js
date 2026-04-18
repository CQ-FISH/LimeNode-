/**
 * 网络路由
 * 处理域名管理、反向代理配置等功能
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');

// 网络管理首页
router.get('/', (req, res) => {
  const userId = req.session.user.id;

  // 获取用户的域名
  const domains = db.get('domains').filter({ userId }).value();

  // 获取用户的反向代理配置
  const proxies = db.get('proxies').filter({ userId }).value();

  res.render('network/index', {
    title: '网络管理',
    domains,
    proxies
  });
});

// 域名列表
router.get('/domains', (req, res) => {
  const userId = req.session.user.id;
  const domains = db.get('domains').filter({ userId }).value();

  res.render('network/domains', {
    title: '域名管理',
    domains
  });
});

// 添加域名
router.post('/domain/add', (req, res) => {
  try {
    const userId = req.session.user.id;
    const { domain, type = 'forward', target } = req.body;

    if (!domain) {
      return res.json({
        success: false,
        message: '请输入域名'
      });
    }

    // 检查域名是否已存在
    const existing = db.get('domains').find({ domain }).value();
    if (existing) {
      return res.json({
        success: false,
        message: '域名已被使用'
      });
    }

    const newDomain = {
      id: uuidv4(),
      userId,
      domain,
      type,
      target: target || '',
      status: 'active',
      createdAt: new Date().toISOString()
    };

    db.get('domains').push(newDomain).write();

    res.json({
      success: true,
      message: '域名添加成功',
      domain: newDomain
    });
  } catch (error) {
    console.error('Add domain error:', error);
    res.json({
      success: false,
      message: '添加失败，请稍后重试'
    });
  }
});

// 删除域名
router.post('/domain/delete', (req, res) => {
  try {
    const userId = req.session.user.id;
    const { domainId } = req.body;

    db.get('domains').remove({ id: domainId, userId }).write();

    res.json({
      success: true,
      message: '域名已删除'
    });
  } catch (error) {
    console.error('Delete domain error:', error);
    res.json({
      success: false,
      message: '删除失败'
    });
  }
});

// 反向代理列表
router.get('/proxies', (req, res) => {
  const userId = req.session.user.id;
  const proxies = db.get('proxies').filter({ userId }).value();

  res.render('network/proxies', {
    title: '反向代理',
    proxies
  });
});

// 添加反向代理
router.post('/proxy/add', (req, res) => {
  try {
    const userId = req.session.user.id;
    const { name, domain, targetUrl, path = '/', ssl = false } = req.body;

    if (!name || !domain || !targetUrl) {
      return res.json({
        success: false,
        message: '请填写所有必填项'
      });
    }

    const newProxy = {
      id: uuidv4(),
      userId,
      name,
      domain,
      targetUrl,
      path,
      ssl,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    db.get('proxies').push(newProxy).write();

    res.json({
      success: true,
      message: '反向代理添加成功',
      proxy: newProxy
    });
  } catch (error) {
    console.error('Add proxy error:', error);
    res.json({
      success: false,
      message: '添加失败，请稍后重试'
    });
  }
});

// 更新反向代理
router.post('/proxy/update', (req, res) => {
  try {
    const userId = req.session.user.id;
    const { proxyId, name, targetUrl, path, ssl } = req.body;

    const proxy = db.get('proxies').find({ id: proxyId, userId }).value();
    if (!proxy) {
      return res.json({
        success: false,
        message: '反向代理不存在'
      });
    }

    db.get('proxies').find({ id: proxyId }).assign({
      name: name || proxy.name,
      targetUrl: targetUrl || proxy.targetUrl,
      path: path || proxy.path,
      ssl: ssl !== undefined ? ssl : proxy.ssl,
      updatedAt: new Date().toISOString()
    }).write();

    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('Update proxy error:', error);
    res.json({
      success: false,
      message: '更新失败'
    });
  }
});

// 删除反向代理
router.post('/proxy/delete', (req, res) => {
  try {
    const userId = req.session.user.id;
    const { proxyId } = req.body;

    db.get('proxies').remove({ id: proxyId, userId }).write();

    res.json({
      success: true,
      message: '已删除'
    });
  } catch (error) {
    console.error('Delete proxy error:', error);
    res.json({
      success: false,
      message: '删除失败'
    });
  }
});

module.exports = router;
