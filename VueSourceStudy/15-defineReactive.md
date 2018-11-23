# defineReactive

这个方法是实现数据双向绑定的核心，
```
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
  const dep = new Dep()

  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  const getter = property && property.get
  const setter = property && property.set
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }

  let childOb = !shallow && observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      const value = getter ? getter.call(obj) : val
      if (Dep.target) {
        dep.depend()
        if (childOb) {
          childOb.dep.depend()
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // #7981: for accessor properties without setter
      if (getter && !setter) return
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      childOb = !shallow && observe(newVal)
      dep.notify()
    }
  })
}
```

这里通过JavaScript的Object.defineProperty重新定义了get和set的描述。
调用get，就会为obj[key]添加一个依赖。
调用set时，就会通过notify通知更新视图。
从而达到数据的双向绑定。

```
const dep = new Dep()
```
Dep 是整个 getter 依赖收集的核心。
```
const property = Object.getOwnPropertyDescriptor(obj, key)
```
Object.getOwnPropertyDescriptor获取指定对象上一个自由属性对应的属性描述符。
```
  if (property && property.configurable === false) {
    return
  }
```
如果这个属性是不可配置的，即configurable = true，则表示该属性的属性描述符不可以改变，所以后续的操作就没有意义了，直接返回。
```
  // cater for pre-defined getter/setters
  const getter = property && property.get
  const setter = property && property.set
```
这里缓存预定义的getter和setter属性描述符。后边会用到。
```
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }
```
若果参数中没有传属性的值，则取下该属性的值。
```
let childOb = !shallow && observe(val)
```
如果属性的值是一个对象，为这个对象创建观察者实例，使这个对象也是响应的。
接下来看一下重写的get
```
    get: function reactiveGetter () {
      const value = getter ? getter.call(obj) : val
      if (Dep.target) {
        dep.depend()
        if (childOb) {
          childOb.dep.depend()
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
    }
```
get的意义其实就是返回当前改属性的值，所以第一句话是调用之前缓存的getter拿到属性的值，最后return出去。
最主要的部分是这中间的部分。
这里先知道下，Dep.target是一个静态属性，这是一个全局唯一的Watcher，因为在同一时间只能有一个全局的 Watcher 被计算。
`dep.depend()`是在当前dep对象的subs中推入一个watcher。
```
  childOb.dep.depend()
  if (Array.isArray(value)) {
    dependArray(value)
  }
```
同理，为属性内部对象属性的依赖对象添加watcher。

看完get，我们再来看下setter
```
  const value = getter ? getter.call(obj) : val
  /* eslint-disable no-self-compare */
  if (newVal === value || (newVal !== newVal && value !== value)) {
    return
  }
  /* eslint-enable no-self-compare */
  if (process.env.NODE_ENV !== 'production' && customSetter) {
    customSetter()
  }
  // #7981: for accessor properties without setter
  if (getter && !setter) return
  if (setter) {
    setter.call(obj, newVal)
  } else {
    val = newVal
  }
  childOb = !shallow && observe(newVal)
  dep.notify()
```

第一行取出当前的属性值。
```
  if (newVal === value || (newVal !== newVal && value !== value)) {
    return
  }
```
然后判断值是否有发生改变，如果没有发生改变则不需要更新视图，直接return。
```
  if (process.env.NODE_ENV !== 'production' && customSetter) {
    customSetter()
  }
```
customSetter是调用defineReactive时传入的参数，如果有就执行。
`if (getter && !setter) return`如果有getter没有setter，这说明值是不能改变的，直接返回。
```
  if (setter) {
    setter.call(obj, newVal)
  } else {
    val = newVal
  }
```
这里就是更新属性的值。
`childOb = !shallow && observe(newVal)`属性值发生了改变，同样如果是值为对象，创建或返回存在的观察者。
`dep.notify()`更新视图。主要是调用watcher的update方法，后期详细讲。

