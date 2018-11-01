# initMixin（1）

作用为Vue原型添加_init方法，该方法在构造函数中调用

```
    function Vue(options) {
        this._init(options);
    }
```

## Performance Api
> The Performance interface provides access to performance-related information for the current page. It's part of the High Resolution Time API, but is enhanced by the Performance Timeline API, the Navigation Timing API, the User Timing API, and the Resource Timing API.

Performace接口允许访问当前页面性能相关的信息。它是High Resolution Time API的一部分。但是它被Performance Timeline API, the Navigation Timing API, the User Timing API, and the Resource Timing API扩展增强了。实际上Performance的主要功能都是由这几个API提供的。

![performance](./img/performance.png 'performance')

performance有4个属性：

- memory:该属性是Chrome浏览器添加的扩展，返回内存的使用信息。
- navigation:对象提供了在指定的时间段里发生的操作相关信息，包括页面是加载还是刷新、发生了多少次重定向等等。
    navigation返回PerformanceNavigation对象，对象包含2个属性：
    + type:表示如何导航到这个页面的，有4个值
        + 0：当前页面是通过点击链接，书签和表单提交，或者脚本操作，或者在url中直接输入地址
        + 1：点击刷新页面按钮或者通过Location.reload()方法显示的页面
        + 2：页面通过历史记录和前进后退访问时
        + 255：任何其他方式
    + redirectCount：页面重定向的次数表示在到达这个页面之前重定向了多少次
- timeOrigin:返回性能测量开始时的时间的高精度时间戳。
- timing:包含延迟相关的性能信息。
    timing返回的对象所包含的属性
    + navigationStart：表征了从同一个浏览器上下文的上一个文档卸载(unload)结束时的时间戳。如果没有上一个文档，这个值会和fetchStart相同
    + unloadEventStart：如果前一个网页与当前网页属于同一个域下，则表示前一个网页的unload回调结束时的时间戳。如果没有前一个网页，或者之前的网页跳转不是属于同一个域内，则返回值为0。
    + unloadEventEnd：前一个页面unload结束的时间戳。如果没有前一个网页，或者需要重定向到不同域，则返回值为0.
    + redirectStart：第一个重定向开始的时间戳，如果没有重定向，或者重定向到不同的域，返回值为0.
    + redirectEnd：最后一个重定向结束，即收到http相应的最后一个字节时的时间戳。如果没有重定向，或者重定向到不同的域，返回值为0.
    + fetchStart：表示浏览器准备好通过http request去获取文档的时间戳，在检查缓存之前发生。
    + domainLookupStart：域名解析开始的时间戳。如果使用的持久连接，或者域名信息存储在缓存里，返回值和fetchStart相同。
    + domainLookupEnd：域名解析结束的时间戳。如果使用的持久连接，或者域名信息存储在缓存里，返回值和fetchStart相同。
    + connectStart：HTTP请求开始向服务器发送时的时间戳，如果是持久连接，则等同于fetchStart。
    + connectEnd：浏览器与服务器之间的连接建立时的时间戳，连接建立指的是所有握手和认证过程全部结束。
    + secureConnectionStart：浏览器与服务器开始安全链接的握手时的时间戳。如果当前网页不要求安全连接，则返回0。
    + requestStart：浏览器向服务器发出HTTP请求时（或开始读取本地缓存时）的时间戳。
    + responseStart：浏览器从服务器（或缓存）收到响应时的时间戳。
    + responseEnd：浏览器从服务器或缓存收到最后一字节响应时的时间戳。如果先断开了连接，则返回断开连接时的时间戳。
    + domLoading：   当前网页DOM结构开始解析时,也就是Document.readyState属性变为“loading”、并且相应的readystatechange事件触发时的时间戳。
    + domInteractive：当前网页DOM结构结束解析、开始加载内嵌资源时，也就是Document.readyState属性变为“interactive”、并且相应的readystatechange事件触发时的时间戳。
    + domContentLoadedEventStart：当前网页DOMContentLoaded事件发生时，也就是DOM结构解析完毕、所有脚本开始运行时的时间戳。
    + domContentLoadedEventEnd：所有脚本运行完成时的时间戳。
    + domComplete：当前网页DOM结构结束解析，也就是Document.readyState属性变为“complete”，并响应readystatechange事件时的时间戳。
    + loadEventStart：当前网页load事件的回调函数开始时的时间戳。如果该事件还没有发生，返回0。
    + loadEventEnd：当前网页load事件的回调函数结束时的时间戳。如果该事件还没有发生，返回0。

举例：

计算整个页面加载的时间
```
    var t = performance.timing;
    var loadTime = t.loadEventEnd - t.navigationStart;
```
计算请求的时长
```
    var requestTimte = t.resopnseEnd - t.requestStart;
```
计算页面渲染的时间
```
    var renderTime = t.domComplete - t.domLoading;
```

performance对象的方法

- clearMarks()：将给定的 mark 从浏览器的性能输入缓冲区中移除。
- clearMeasures()：将给定的 measure 从浏览器的性能输入缓冲区中移除。
- clearResourceTimings()：从浏览器的性能数据缓冲区中移除所有 entryType 是 "resource" 的  performance entries。
- getEntries()：基于给定的 filter 返回一个 PerformanceEntry 对象的列表。
- getEntriesByName()：基于给定的 name 和 entry type 返回一个 PerformanceEntry 对象的列表。
- getEntriesByType()：基于给定的 entry type 返回一个 PerformanceEntry 对象的列表
- mark()：根据给出 name 值，在浏览器的性能输入缓冲区中创建一个相关的timestamp。
- measure()：在浏览器的指定 start mark 和 end mark 间的性能输入缓冲区中创建一个指定的 timestamp。
- now()：返回一个表示从性能测量时刻开始经过的毫秒数 DOMHighResTimeStamp。
- setResourceTimingBufferSize()：将浏览器的资源 timing 缓冲区的大小设置为 "resource" type performance entry 对象的指定数量。
- toJSON()：返回 Performance 对象的 JSON 对象。

例：
```
    //标记一个开始点
    performance.mark('test-per-start');
    //耗时操作
    for (let i = 0; i < 1000; i++) {
        console.log(1);
    }
    //标记结束点
    performance.mark('test-per-end');
    //标记开始点和结束点之间的时间戳
    performance.measure('test-per', 'test-per-start', 'test-per-end');

    console.log(performance.getEntriesByName('test-per'));
    performance.clearMarks('test-per-start');
    performance.clearMarks('test-per-end');
    performance.clearMeasures('test-per');
```