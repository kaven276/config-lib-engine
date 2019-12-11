
const Koa = require('koa');

const { configMap } = require('./servicesMap.js');

const app = new Koa();

// 如果是 content-type:text/* 则强制认为是 application/json
// 避免浏览器直接发 application/json 造成 Preflighted requests
// 需要在 koa-body 自动解析前设置完毕
app.use(async (ctx, next) => {
  const contentType = ctx.headers['content-type'];
  if (contentType && contentType.match(/^text\//)) {
    ctx.headers['content-type'] = 'application/json';
  }
  await next();
});

// 获取请求体，解析成 js 数据，目前看必须是第一个中间件
app.use(require('koa-body')({
  formLimit: 10 * 1000 * 1000, // 上传大小 10M 以内都允许，默认是 56kb
}));

// 任何情形，允许跨域访问
app.use(async (ctx, next) => {
  await next();
  ctx.set('Access-Control-Allow-Origin', '*');
});

app.use(async (ctx, next) => {
  ctx.state.req = {
    ...ctx.request.body,
    ...ctx.query,
  };
  const req = ctx.state.req;
  const stdConfig = ctx.path.endsWith('/') ? configMap[ctx.path].index() : configMap[ctx.path];
  let result;
  if (stdConfig instanceof Array) {
    result = stdConfig.filter((row) => {
      let hit = true;
      Object.keys(req).forEach((key) => {
        if (row[key] !== req[key]) hit = false;
      });
      return hit;
    });
  } else {
    result = stdConfig;
  }
  ctx.body = {
    respCode: 0,
    respDesc: '',
    data: result,
  };
  await next();
});

app.listen(process.env.PORT || 3019, '0.0.0.0');
