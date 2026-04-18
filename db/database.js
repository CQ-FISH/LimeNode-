const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, '../data/db.json');

// 创建低适配器
const adapter = new FileSync(dbPath);
const db = low(adapter);

// 初始化数据库结构
db.defaults({
  users: [],        // 用户表
  products: [],     // 产品/服务表
  cart: [],         // 购物车表
  orders: [],       // 订单表
  services: [],     // 服务实例表
  domains: [],      // 域名表
  proxies: [],      // 反向代理表
  securityLogs: [], // 安全日志表
  bills: []         // 账单表
}).write();

// 初始化产品数据
const products = db.get('products').value();
if (products.length === 0) {
  // 云服务器产品
  db.get('products').push({
    id: 'svs-001',
    name: '轻量云服务器',
    category: 'compute',
    type: 'cloud_server',
    description: '高性能云服务器，适合网站和应用部署',
    price: 29.9,
    period: 'month',
    specs: {
      cpu: '2核',
      ram: '2GB',
      disk: '40GB SSD',
      bandwidth: '5Mbps',
      traffic: '500GB/月'
    },
    stock: 100,
    status: 'active',
    createdAt: new Date().toISOString()
  }).push({
    id: 'svs-002',
    name: '标准云服务器',
    category: 'compute',
    type: 'cloud_server',
    description: '大内存大带宽，适合企业级应用',
    price: 99.9,
    period: 'month',
    specs: {
      cpu: '4核',
      ram: '8GB',
      disk: '100GB SSD',
      bandwidth: '20Mbps',
      traffic: '2TB/月'
    },
    stock: 50,
    status: 'active',
    createdAt: new Date().toISOString()
  }).push({
    id: 'svs-003',
    name: '旗舰云服务器',
    category: 'compute',
    type: 'cloud_server',
    description: '顶配服务器，适合大型网站和复杂应用',
    price: 299.9,
    period: 'month',
    specs: {
      cpu: '8核',
      ram: '32GB',
      disk: '500GB SSD',
      bandwidth: '100Mbps',
      traffic: '无限流量'
    },
    stock: 20,
    status: 'active',
    createdAt: new Date().toISOString()
  }).push({
    id: 'sto-001',
    name: '对象存储 100GB',
    category: 'storage',
    type: 'object_storage',
    description: '海量存储空间，适合文件备份和分发',
    price: 9.9,
    period: 'month',
    specs: {
      capacity: '100GB',
      traffic: '包含',
      backup: '自动备份'
    },
    stock: 999,
    status: 'active',
    createdAt: new Date().toISOString()
  }).push({
    id: 'sto-002',
    name: '对象存储 500GB',
    category: 'storage',
    type: 'object_storage',
    description: '大容量存储方案，适合企业用户',
    price: 39.9,
    period: 'month',
    specs: {
      capacity: '500GB',
      traffic: '包含',
      backup: '自动备份'
    },
    stock: 999,
    status: 'active',
    createdAt: new Date().toISOString()
  }).push({
    id: 'net-001',
    name: '弹性公网IP',
    category: 'network',
    type: 'eip',
    description: '独立公网IP地址，支持绑定和解绑',
    price: 5.9,
    period: 'month',
    specs: {
      bandwidth: '5Mbps',
      traffic: '按量计费'
    },
    stock: 500,
    status: 'active',
    createdAt: new Date().toISOString()
  }).push({
    id: 'net-002',
    name: '域名注册',
    category: 'network',
    type: 'domain',
    description: '提供主流域名注册服务',
    price: 29.9,
    period: 'year',
    specs: {
      tld: '.com/.cn/.net',
      dns: '免费DNS',
      ssl: '免费SSL证书'
    },
    stock: 999,
    status: 'active',
    createdAt: new Date().toISOString()
  }).push({
    id: 'sec-001',
    name: '基础防护',
    category: 'security',
    type: 'firewall',
    description: 'DDoS基础防护，保护服务器安全',
    price: 0,
    period: 'month',
    specs: {
      ddos: '10Gbps',
      firewall: '基础规则',
      log: '7天日志'
    },
    stock: 999,
    status: 'active',
    createdAt: new Date().toISOString()
  }).push({
    id: 'sec-002',
    name: '企业防护',
    category: 'security',
    type: 'firewall',
    description: '企业级DDoS防护，完整安全服务',
    price: 99.9,
    period: 'month',
    specs: {
      ddos: '100Gbps',
      firewall: '高级规则',
      log: '30天日志',
      waf: 'Web应用防火墙'
    },
    stock: 100,
    status: 'active',
    createdAt: new Date().toISOString()
  }).write();
}

module.exports = db;
