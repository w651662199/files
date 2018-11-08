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
