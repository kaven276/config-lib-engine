概要说明
=========

* 可以集中收集各个应用的配置信息，如产品配置等等
* 方便配置进行版本控制(和库表保存比)
* 方便在不同环境部署不同的分支和版本(和库表保存比)
* 方便继续演进服务，如过滤，单条配置查询等等

配置文件
=======

支持配置文件的格式
----------------
* yaml/yml
* md/markdown
* json,json5
* csv,tsv

markdown 配置
--------------
* 可以随意些其他文档，直接忽略
* 支持 table 写法
* 取第一个 table 作为数据源
* table 表头作为每条记录的字段 key
* table 表头支持 name:num 方式，将字符串转换成数字返回

目录配置
=========

每个目录可以配置 config.js 文件，里面通过 exports.xxx 配置校验器，目录服务等等

validator 配置
---------------

范例见 [services/FormEngine/config.js](./services/FormEngine/config.js)

```javascript
exports.validator = (filename, config) => configValicator;
```

- exports.validator 为校验器工厂函数
- 根据 filename 配置文件名称，config 配置解析完的数据结构，返回校验器函数。
- 返回的校验器可以采用各种第三方校验包支持(需应用自己npm引用)，也可以自己手写，
- 推荐使用 [superstruct](https://github.com/ianstormtaylor/superstruct#readme) 校验

目录索引服务配置
---------------

范例见 [services/CompProduct/config.js](./services/CompProduct/config.js)

```javascript
exports.index = subMap =>
  Object.entries(subMap).map(([k, v]) => ({
    fileName: k,
    productName: v.xxProductName,
  }));;
```

- exports.index 为访问 /dirname/ (注意最后面的斜杠) 时执行，结果作为接口响应返回
- subMap 参数被框架自动注入，值为文件名到对应解析好的配置数据结构的 key/value 对象结构
- 上面范例当访问 `/CompProduct/` 时，将返回下面多个配置文件的数组，每项包含文件名和对应配置的xxProductName数据项

Roadmap
========
- [] markdown 配置复杂数据结构，突破单 table 限制
- [] 不同的部署环境(测试，预发布，生产等等)可以使用不同的配置文件
