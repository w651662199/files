# Observer

观察者类，
>Observer class that is attached to each observed object. Once attached, the observer converts the target object's property keys into getter/setters that collect dependencies and dispatch updates.

作者的注释：观察者类将对象的属性转换为getter/setter，从而收集依赖和分发更新。

看下构造函数
```
  constructor (value: any) {
    this.value = value
    this.dep = new Dep()
    this.vmCount = 0
    def(value, '__ob__', this)
    if (Array.isArray(value)) {
      if (hasProto) {
        protoAugment(value, arrayMethods)
      } else {
        copyAugment(value, arrayMethods, arrayKeys)
      }
      this.observeArray(value)
    } else {
      this.walk(value)
    }
  }
```
构造函数接收一个任意类型的参数，在构造函数里，定义了dep,用于收集这个属性的依赖关系。
并为属性定义\_\_ob__,指向当前的对象。
这里针对value的类型，进行不同操作，当value是数组时，首先将数组的prototype定义复制一份到value上。

```
export function observe (value: any, asRootData: ?boolean): Observer | void {
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob: Observer | void
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}
```
当value为数组时，要判断数组的每个元素是否为对象或数组，如果是，则要为对象内的每个选项创建相应的观察者。如果不是对象，或者是一个VNode，则不为其创建相应的观察者。

如果value不是数组，则调用walk，将value对象的每个属性实现为响应式的。

```
  walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }
```
之前defineReactive已经讲过，不清楚的同学请自行查看之前的文档。

