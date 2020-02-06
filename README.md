概要说明
=========

* 产品配置不再配置很多表和子表，直接在配置文件中一目了然完成配置
* 产品配置结果容易转换成前台需要的格式，免去后台开发的负担
* 产品配置微服务化，独立部署独立实现服务，完全自包含
* 可以集中收集配置各个应用的配置信息，如产品配置等等
* 配置数据不再放到数据库中，特别是去O，不再依赖额外的基础设施
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

使用 yaml 做配置技术上的优势
---------------------------
* 层次，对象，数组结构
* 引用，避免重复
* 各个数据类型写法简洁，可强制设置类型
* 字符串可控制换行不换行
* 简洁干净，避开各种封闭符号，如：引号、各种括号等
* 注释方便，一次注释一整个 branch

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

- 范例1见 [services/FormEngine/config.js](./services/FormEngine/config.js) 使用 [superstruct][] 校验
- 范例2见 [services/example/config.js](./services/example/config.js) 使用 [fastest-validator][] 校验

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

开发运行服务
==========

## 版本管理

`npm test` 加载全部配置，全部通过校验后，进程退出返回成功0；git 版本提交前可以通过 husky 确保检查成功后才允许提交

## 运行阶段

pm2 cluster 引导服务时，只有当全部配置加载和校验通过后，才会发出 process.send('ready')，开始接受请求。
因此 pm2 集群模式下，可以完全做到零中断重启，全量更新。

## 参数筛选

普通调用会将配置文件内容全部返回，而带参数删选范例，只返回了匹配查询串的一条记录，如：
```
curl 'http://127.0.0.1:3019/example/table?PRODUCT_ID=90529831'
{"respCode":0,"respDesc":"","data":[{"PRODUCT_ID":"90529831","PRODUCT_ALLNAME":"2019年2月天津冰激凌套餐99元档购机送券合约每月送35元花呗还款电子券（24个月）[社会渠道]","PRODUCT_NAME":"每月送35元花呗还款电子券（24个月）[社会渠道]","PRICE":720}]
```

## pretty 响应

当请求参数带有 pretty 时，则响应按照两个空格缩进格式化完返回，方便人眼看
```
curl 'http://127.0.0.1:3019/example/schema'         
{"respCode":0,"respDesc":"","data":{"type":"object","properties":{"first_name":{"type":"string"},"last_name":{"type":"string"},"birthday":{"type":"string","format":"date"},"address":{"type":"object","properties":{"streed_address":{"type":"string"},"city":{"type":"string"},"state":{"type":"string"},"country":{"type":"string"}}}}}

curl 'http://127.0.0.1:3019/example/schema?pretty=1'
{
  "respCode": 0,
  "respDesc": "",
  "data": {
    "type": "object",
    "properties": {
      "first_name": {
        "type": "string"
      },
      "last_name": {
        "type": "string"
      },
      "birthday": {
        "type": "string",
        "format": "date"
      },
      "address": {
        "type": "object",
        "properties": {
          "streed_address": {
            "type": "string"
          },
          "city": {
            "type": "string"
          },
          "state": {
            "type": "string"
          },
          "country": {
            "type": "string"
          }
        }
      }
    }
  }
}
```

Roadmap
========
- [x] git commit 快速扫描目录校验，不等待 chokidar 完成；可以按照计数来确定是否完成，完成无报错 exit 0
- [x] example 应用第二个校验库 fastest-validator
- [] 文档说明 config-lib 如何使用引擎和配置，包括版本提交校验，端口配置，库路径配置等等。
- [] 配置校验，不通过校验，退出
- [] markdown 配置复杂数据结构，突破单 table 限制
- [] 只有变更过的文件才进行校验
- [] 不同的部署环境(测试，预发布，生产等等)可以使用不同的配置文件


[superstruct]: https://github.com/ianstormtaylor/superstruct#readme
[fastest-validator]: https://github.com/icebob/fastest-validator
