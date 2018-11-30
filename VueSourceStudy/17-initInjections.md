# initInjections

执行完initRender后，`callHook(vm, 'beforeCreate')`调用了实例的beforeCreate钩子函数，
>在实例初始化之后，数据观测 (data observer) 和 event/watcher 事件配置之前被调用。

所以接下来就是数据观测的核心内容了。
接着代码，进入了initInjections。从命名，我们大致可以猜到，应该是对实例的inject选项进行初始化操作，废话不多说，上源码。
```
export function initInjections (vm: Component) {
  const result = resolveInject(vm.$options.inject, vm)
  if (result) {
    toggleObserving(false)
    Object.keys(result).forEach(key => {
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== 'production') {
        defineReactive(vm, key, result[key], () => {
          warn(
            `Avoid mutating an injected value directly since the changes will be ` +
            `overwritten whenever the provided component re-renders. ` +
            `injection being mutated: "${key}"`,
            vm
          )
        })
      } else {
        defineReactive(vm, key, result[key])
      }
    })
    toggleObserving(true)
  }
}
```
代码一进来，先执行了resolveInject方法转换实例上的inject选项。
接下来，我们先看看这个方法。
```
if (inject) {
  ...
}
```
因为inject选项不是必须的，所以可能不存在，所以判断下inject选项是否存在，存在才进行进一步的操作。
`const result = Object.create(null)` 创建一个接收结果的空对象。
```
const keys = hasSymbol
      ? Reflect.ownKeys(inject).filter(key => {
        /* istanbul ignore next */
        return Object.getOwnPropertyDescriptor(inject, key).enumerable
      })
      : Object.keys(inject)
```
这里判断环境是否支持Symbol对象，如果支持的话，使用Reflect.ownKeys取回inject选项中可遍历的属性。因为Symbol作为key的选项是不能通过Object.keys获取的，这里不细讲，有不清楚的同学请自行补课。
然后是根据得到的key进行遍历
```
  //拿到当前遍历的key
  const key = keys[i]
  //拿到该选项的源属性，因为其原属性是可以的改的
  //官网：from 属性是在可用的注入内容中搜索用的 key (字符串或 Symbol)
  const provideKey = inject[key].from
  //缓存当前实例
  let source = vm
  //循环遍历，查到当前key的属性的值
  while (source) {
    //判断当前实例是否有provide的属性，如果有再判断当前所查找的key是不是当前实例提供的
    if (source._provided && hasOwn(source._provided, provideKey)) {
      //若果条件满足，则从提供该选项的实例上取到该选项的值。
      result[key] = source._provided[provideKey]
      break
    }
    //如果不满足，则向当前实例的父亲继续查找，因为provide提供的值可以跨越多级子节点
    source = source.$parent
  }
  //如果没有查到当前的key对应值，即节点树的根是没有父元素
  if (!source) {
    //在当前的key中是否定义了default
    //官网：default 属性是降级情况下使用的 value
    //即设置选项的默认值
    if ('default' in inject[key]) {
      //如果有default，则最终值放入result中
      const provideDefault = inject[key].default
      result[key] = typeof provideDefault === 'function'
        ? provideDefault.call(vm)
        : provideDefault
    } else if (process.env.NODE_ENV !== 'production') {
      //如果没有默认值，则警告
      warn(`Injection "${key}" not found`, vm)
    }
  }
```

接下来，我们再回到initInjections中继续放下看。
```
    Object.keys(result).forEach(key => {
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== 'production') {
        defineReactive(vm, key, result[key], () => {
          warn(
            `Avoid mutating an injected value directly since the changes will be ` +
            `overwritten whenever the provided component re-renders. ` +
            `injection being mutated: "${key}"`,
            vm
          )
        })
      } else {
        defineReactive(vm, key, result[key])
      }
    })
```
为inject的每个选项实现双向绑定。
