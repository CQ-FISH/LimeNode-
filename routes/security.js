/**
 * 安全路由
 * 处理安全防护、日志等功能
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');

// 安全中心首页
router.get('/', (req, res) => {
  const userId = req.session.user.id;

  // 获取安全日志
  const logs = db.get('securityLogs').filter({ userId }).value();

  // 获取用户服务的安全状态
  const services = db.get('services').filter({ userId }).value();
  const servicesWithSecurity = services.map(service => ({
    ...service,
    protection: service.protection || 'basic'
  }));

  // 模拟安全统计
  const stats = {
    totalThreats: logs.filter(l => l.level === 'danger').length,
    blockedAttacks: Math.floor(Math.random() * 1000),
    securityScore: 85 + Math.floor(Math.random() * 15)
  };

  res.render('security/index', {
    title: '安全管理',
    logs: logs.slice(-20).reverse(),
    services: servicesWithSecurity,
    stats
  });
});

// 安全日志页面
router.get('/logs', (req, res) => {
  const userId = req.session.user.id;
  const logs = db.get('securityLogs').filter({ userId }).value().reverse();

  res.render('security/logs', {
    title: '安全日志',
    logs
  });
});

// 模拟添加安全日志
function addSecurityLog(userId, type, level, message, details = {}) {
  const log = {
    id: uuidv4(),
    userId,
    type,
    level,
    message,
    details,
    ip: '192.168.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255),
    createdAt: new Date().toISOString()
  };
  db.get('securityLogs').push(log).write();
  return log;
}

// 获取安全状态
router.get('/status', (req, res) => {
  const userId = req.session.user.id;
  const services = db.get('services').filter({ userId }).value();

  // 模拟一些安全日志
  if (Math.random() > 0.7) {
    addSecurityLog(
      userId,
      'firewall',
      Math.random() > 0.5 ? 'warning' : 'info',
      Math.random() > 0.5 ? '检测到异常访问尝试' : '防火墙规则已更新',
      { serviceId: services[0]?.id }
    );
  }

  const logs = db.get('securityLogs').filter({ userId }).value();

  res.json({
    success: true,
    data: {
      protectionLevel: 'enterprise',
      threatsDetected: logs.filter(l => l.level === 'danger').length,
      blockedRequests: Math.floor(Math.random() * 10000),
      lastScan: new Date().toISOString()
    }
  });
});

// 更新防护状态
router.post('/protection/update', (req, res) => {
  try {
    const userId = req.session.user.id;
    const { serviceId, level } = req.body;

    const service = db.get('services').find({ id: serviceId, userId }).value();
    if (!service) {
      return res.json({
        success: false,
        message: '服务不存在'
      });
    }

    db.get('services').find({ id: serviceId }).assign({
      protection: level,
      updatedAt: new Date().toISOString()
    }).write();

    // 记录日志
    addSecurityLog(
      userId,
      'protection',
      'info',
      `服务 ${service.productName} 防护等级已更新为 ${level}`,
      { serviceId, level }
    );

    res.json({
      success: true,
      message: '防护状态已更新'
    });
  } catch (error) {
    console.error('Update protection error:', error);
    res.json({
      success: false,
      message: '更新失败'
    });
  }
});

// 手动扫描
router.post('/scan', (req, res) => {
  try {
    const userId = req.session.user.id;
    const { serviceId } = req.body;

    const service = db.get('services').find({ id: serviceId, userId }).value();
    if (!service) {
      return res.json({
        success: false,
        message: '服务不存在'
      });
    }

    // 模拟扫描
    const scanResult = {
      vulnerabilities: Math.floor(Math.random() * 5),
      malware: Math.floor(Math.random() * 3),
      ports: [22, 80, 443, 3306].filter(() => Math.random() > 0.3),
      recommendations: []
    };

    if (scanResult.vulnerabilities > 0) {
      scanResult.recommendations.push('发现 ' + scanResult.vulnerabilities + ' 个漏洞，建议更新系统补丁');
    }
    if (scanResult.ports.includes(3306)) {
      scanResult.recommendations.push('检测到数据库端口开放，建议限制访问');
    }

    // 记录日志
    addSecurityLog(
      userId,
      'scan',
      scanResult.vulnerabilities > 0 ? 'warning' : 'success',
      `安全扫描完成：发现 ${scanResult.vulnerabilities} 个漏洞`,
      { serviceId, scanResult }
    );

    res.json({
      success: true,
      message: '扫描完成',
      result: scanResult
    });
  } catch (error) {
    console.error('Security scan error:', error);
    res.json({
      success: false,
      message: '扫描失败'
    });
  }
});

module.exports = router;
