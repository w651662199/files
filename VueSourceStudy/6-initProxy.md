# initProxy

在_init中，合并选项后，继续往下看
```
if (process.env.NODE_ENV !== 'production') {
  initProxy(vm)
}
```

当在非生产环境时，进行initProxy操作，我们找到initProxy，进去看看具体的操作。

我们先看initProxy的实现
```
  initProxy = function initProxy (vm) {
    if (hasProxy) {
      // determine which proxy handler to use
      const options = vm.$options
      const handlers = options.render && options.render._withStripped
        ? getHandler
        : hasHandler
      vm._renderProxy = new Proxy(vm, handlers)
    } else {
      vm._renderProxy = vm
    }
  }
```

这里主要分两种情况，其中如果Proxy不存在，则_renderProxy就等于vm实例自己。
我们这里看另一种情况，即Proxy存在时
```
const hasProxy = typeof Proxy !== 'undefined' && isNative(Proxy)
```

Proxy 是一个全局的对象，这里有详细的文档 [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)

下面看有Proxy时的实现
```
  // determine which proxy handler to use
  const options = vm.$options
  const handlers = options.render && options.render._withStripped
    ? getHandler
    : hasHandler
  vm._renderProxy = new Proxy(vm, handlers)
```
上边两行代码的作用是决定代理使用的自定义行为，即当options上存在render，并且render上存在_withStripped时，使用getHandler，否则使用hasHandler。

接下来看看getHandler和hasHandler的实现

### getHandler

```
  const getHandler = {
    get (target, key) {
      if (typeof key === 'string' && !(key in target)) {
        if (key in target.$data) warnReservedPrefix(target, key)
        else warnNonPresent(target, key)
      }
      return target[key]
    }
  }
```
这里重新定义了get行为，当key为string并且target不存在key时，检查target.$data是否存在key，如果存在给出警告，如果target.$data中不存在key，给出另一种警告。
下面看下警告的内容
```
  const warnReservedPrefix = (target, key) => {
    warn(
      `Property "${key}" must be accessed with "$data.${key}" because ` +
      'properties starting with "$" or "_" are not proxied in the Vue instance to ' +
      'prevent conflicts with Vue internals' +
      'See: https://vuejs.org/v2/api/#data',
      target
    )
  }
```
当key在$data中存在时，警告的内容是‘属性必须通过$data.${key}访问，因为属性以$或者_开头，没有在Vue实例中添加相应的代理’
```
  const warnNonPresent = (target, key) => {
    warn(
      `Property or method "${key}" is not defined on the instance but ` +
      'referenced during render. Make sure that this property is reactive, ' +
      'either in the data option, or for class-based components, by ' +
      'initializing the property. ' +
      'See: https://vuejs.org/v2/guide/reactivity.html#Declaring-Reactive-Properties.',
      target
    )
  }
```
当key在target和$data都不存在时，警告 ‘属性${key}在实例中没有定义，但是在渲染时确用到了，请确认属性存在’

### hasHandler
```
  const hasHandler = {
    has (target, key) {
      const has = key in target
      const isAllowed = allowedGlobals(key) ||
        (typeof key === 'string' && key.charAt(0) === '_' && !(key in target.$data))
      if (!has && !isAllowed) {
        if (key in target.$data) warnReservedPrefix(target, key)
        else warnNonPresent(target, key)
      }
      return has || !isAllowed
    }
  }
```
hasHandler方法的应用场景在于查看vm实例是否拥有某个属性。比如调用for in循环遍历vm实例属性时，会触发hasHandler方法。
首先使用in操作符判断该属性是否在vm实例上存在。
```
const has = key in target
```
接下来通过下列语句，看属性名称是否可用？
```
const isAllowed = allowedGlobals(key) || (typeof key === 'string' && key.charAt(0) === '_' && !(key in target.$data))
```
allowedGlobals的定义如下
```
  const allowedGlobals = makeMap(
    'Infinity,undefined,NaN,isFinite,isNaN,' +
    'parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,' +
    'Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,' +
    'require' // for Webpack/Browserify
  )
```
我们结合makeMap函数一起来看
```
export function makeMap (
  str: string,
  expectsLowerCase?: boolean
): (key: string) => true | void {
  const map = Object.create(null)
  const list: Array<string> = str.split(',')
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true
  }
  return expectsLowerCase
    ? val => map[val.toLowerCase()]
    : val => map[val]
}
```
先来分析makeMap，其作用是通过传入的string参数来生成映射表。如传入下列参数
```
'Infinity,undefined,NaN,isFinite,isNaN,'
....
```
通过makeMap方法可以生成下面这样的一个映射表
```
{
  Infinity: true,
  undefined: true
  ......
}
```
这个方法非常有用，我们在日常写代码的时候也可以进行借鉴。
回到hasHandler源码中。allowedGlobals最终存储的是一个代表特殊属性名称的映射表。
所以结合has和isAllowed属性，我们知道当读取对象属性时，如果属性名在vm上不存在，且不在特殊属性名称映射表中，或没有以_符号开头。则抛出异常。

最后回到initProxy代码中
```
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
```
如果Proxy属性存在，则把包装后的vm属性赋值给_renderProxy属性值。否则把vm是实例本身赋值给_renderProxy属性


在initProxy中还有一段代码
```
  if (hasProxy) {
    const isBuiltInModifier = makeMap('stop,prevent,self,ctrl,shift,alt,meta,exact')
    config.keyCodes = new Proxy(config.keyCodes, {
      set (target, key, value) {
        if (isBuiltInModifier(key)) {
          warn(`Avoid overwriting built-in modifier in config.keyCodes: .${key}`)
          return false
        } else {
          target[key] = value
          return true
        }
      }
    })
  }
```
这段代码的用途是为config.keyCodes 的set 进行自定义，禁止对‘stop,prevent,self,ctrl,shift,alt,meta,exac’这些字段进行赋值