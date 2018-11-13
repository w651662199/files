# updateListeners

上篇我们讲了updateComponentListeners和updateListeners中用到的add与remove方法。
这里我们将继续看updateListeners的实现。
updateListeners的定义是在/src/core/vdom/helpers/update-listeners.js中，所以我们可以推断出这是虚拟dom的辅助方法。

下边我们贴出源码
```
export function updateListeners (
  on: Object,
  oldOn: Object,
  add: Function,
  remove: Function,
  vm: Component
) {
  let name, def, cur, old, event
  for (name in on) {
    def = cur = on[name]
    old = oldOn[name]
    event = normalizeEvent(name)
    /* istanbul ignore if */
    if (__WEEX__ && isPlainObject(def)) {
      cur = def.handler
      event.params = def.params
    }
    if (isUndef(cur)) {
      process.env.NODE_ENV !== 'production' && warn(
        `Invalid handler for event "${event.name}": got ` + String(cur),
        vm
      )
    } else if (isUndef(old)) {
      if (isUndef(cur.fns)) {
        cur = on[name] = createFnInvoker(cur)
      }
      add(event.name, cur, event.once, event.capture, event.passive, event.params)
    } else if (cur !== old) {
      old.fns = cur
      on[name] = old
    }
  }
  for (name in oldOn) {
    if (isUndef(on[name])) {
      event = normalizeEvent(name)
      remove(event.name, oldOn[name], event.capture)
    }
  }
}
```

源码比较多，我们分步来看。
首先我们看下入参
```
  on: Object,
  oldOn: Object,
  add: Function,
  remove: Function,
  vm: Component
```

on 是新的事件监听对象，oldOn是旧的事件监听对象，add和remove是我们上篇讲到的添加和移除事件的方法，vm是调用实例。

看代码第一行

`let name, def, cur, old, event`

这里定义了几个变量，name为事件监听的循环变量，def和cur为新的中key为name的回调，old为旧的事件监听对象中key为name的回调，event为事件对象，我们稍后看event里具体存放的是什么。

接着我们进入了循环
```
for (name in on) {
  ...
}
```
name 为每次循环的key，下面我们将这个for循环拆分开来看。

```
  def = cur = on[name]
  old = oldOn[name]
```
这两行分别是将name所对应的事件监听回调放入到事先定义好的变量中

```
event = normalizeEvent(name)
```
下面我们进入到normalizeEvent里，看看具体的逻辑
```
const normalizeEvent = cached((name: string): {
  name: string,
  once: boolean,
  capture: boolean,
  passive: boolean,
  handler?: Function,
  params?: Array<any>
} => {
  const passive = name.charAt(0) === '&'
  name = passive ? name.slice(1) : name
  const once = name.charAt(0) === '~' // Prefixed last, checked first
  name = once ? name.slice(1) : name
  const capture = name.charAt(0) === '!'
  name = capture ? name.slice(1) : name
  return {
    name,
    once,
    capture,
    passive
  }
})
```

这里用到了一个cached的方法，我们还是先进去看看
```
/**
 * Create a cached version of a pure function.
 */
export function cached<F: Function> (fn: F): F {
  const cache = Object.create(null)
  return (function cachedFn (str: string) {
    const hit = cache[str]
    return hit || (cache[str] = fn(str))
  }: any)
}
```
作者给了一行注释‘为纯函数创建缓存版本’，从代码我们不难看出，方法使用了闭包，将传入的str对应的结果存入cache，这样下次调用cached函数时，如果cached中存在key为str的对象就直接返回。

下面我们再回到normalizeEvent
```
  const passive = name.charAt(0) === '&'
  name = passive ? name.slice(1) : name
  const once = name.charAt(0) === '~' // Prefixed last, checked first
  name = once ? name.slice(1) : name
  const capture = name.charAt(0) === '!'
  name = capture ? name.slice(1) : name
```
通过代码，我们知道这个方法是对事件修饰符进行标识

- passive
这个属性源自addEventListener，我们看下官方的解释

> A Boolean which, if true, indicates that the function specified by listener will never call preventDefault(). If a passive listener does call preventDefault(), the user agent will do nothing other than generate a console warning.

这个属性是一个是否阻止preventDefault调用的一个布尔值，如果只为true，则永远不会调用preventDefault方法。如果标记passive的回调函数调用了preventDefault方法，浏览器代理将会发出一个警告。

所以如果事件名以‘&’开头，则将passive标记为true.并将重新赋值事件名，将‘&’字符去除。

- once
标记事件是否只会触发一次。如果事件名以‘~’开头，则将once标记为true，同样重新赋值事件名。

- capture
这个属性同样是源自addEventListener，同样看下官方的解释

>A Boolean indicating that events of this type will be dispatched to the registered listener before being dispatched to any EventTarget beneath it in the DOM tree.

这个属性的作用是添加事件监听器时使用事件捕获模式，即元素自身触发的事件先在此处理，然后才交由内部元素进行处理。

所以如果以‘!’开头，则标记capture为true，同时重新赋值事件名称

最后
```
  return {
    name,
    once,
    capture,
    passive
  }
```
将这些属性标志位和最终的事件名称以对象的形式返回。

讲完normalizeEvent，我们继续回到updateListeners。
```
  if (__WEEX__ && isPlainObject(def)) {
    cur = def.handler
    event.params = def.params
  }
```
这个if逻辑，是当\_\_WEEX__位true时，并且当def(名为name的事件回调)是函数时执行。
将def的handler赋值给cur,并将def的params参数添加到event对象中。

Weex 是跨平台用户界面开发框架，截止目前，笔者还没有学习过，惭愧啊。

接着往下看
```
  if (isUndef(cur)) {
    process.env.NODE_ENV !== 'production' && warn(
      `Invalid handler for event "${event.name}": got ` + String(cur),
      vm
    )
  }
```
指当名为name的回调的值为undefined或null时，并且是非生产环境，给出一条警告‘非法的事件句柄’。
其中isUndef的定义很简单，这里就只给出源码，不做解释了。
```
export function isUndef (v: any): boolean %checks {
  return v === undefined || v === null
}
```

我们接着往下看
```
  if (isUndef(old)) {
    if (isUndef(cur.fns)) {
      cur = on[name] = createFnInvoker(cur)
    }
    add(event.name, cur, event.once, event.capture, event.passive, event.params)
  }
```
当旧的事件监听里不存在该事件时，判断事件回调对象中是否存在fns属性，如果存在，则直接调用add方法将事件添加到_events数组中。（这里不明白的请看上一篇）
当cur中不存在fns时，调用createFnInvoker，下面我们看下这个方法。

### createFnInvoker
```
export function createFnInvoker (fns: Function | Array<Function>): Function {
  function invoker () {
    const fns = invoker.fns
    if (Array.isArray(fns)) {
      const cloned = fns.slice()
      for (let i = 0; i < cloned.length; i++) {
        cloned[i].apply(null, arguments)
      }
    } else {
      // return handler return value for single handlers
      return fns.apply(null, arguments)
    }
  }
  invoker.fns = fns
  return invoker
}
```
返回的是个方法，方法中根据传入的fns的类型，进行处理，如果fns是数组，则循环调用，如果是函数，则直接调用。

再往下看
```
  if (cur !== old) {
    old.fns = cur
    on[name] = old
  }
```
当新的和旧的中都存在该名称的事件时，并且不相等，则将新的回调赋值给旧的fns，再对新的中事件重新赋值。

再往下看
```
for (name in oldOn) {
  if (isUndef(on[name])) {
    event = normalizeEvent(name)
    remove(event.name, oldOn[name], event.capture)
  }
}
```
循环遍历旧的事件监听，当新的中不存在对应的事件时，将事件从_events中移除。

到此，updateListeners就讲完了。