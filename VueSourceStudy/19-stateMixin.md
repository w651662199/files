# stateMixin

到此，我们已经看完了initMixin的内容，我们接着往下看。
`stateMixin(Vue)`紧跟着initMixin的这句代码，从命名可知，是对vue的状态进行混入。
进入源码
```
export function stateMixin (Vue: Class<Component>) {
  // flow somehow has problems with directly declared definition object
  // when using Object.defineProperty, so we have to procedurally build up
  // the object here.
  const dataDef = {}
  dataDef.get = function () { return this._data }
  const propsDef = {}
  propsDef.get = function () { return this._props }
  if (process.env.NODE_ENV !== 'production') {
    dataDef.set = function (newData: Object) {
      warn(
        'Avoid replacing instance root $data. ' +
        'Use nested data properties instead.',
        this
      )
    }
    propsDef.set = function () {
      warn(`$props is readonly.`, this)
    }
  }
  Object.defineProperty(Vue.prototype, '$data', dataDef)
  Object.defineProperty(Vue.prototype, '$props', propsDef)

  ...

  //Vue.prototype.$watch
  ...
}
```
上边的源码中，我们暂时先拿掉了$watch，后续会详细看。
上部分代码主要是在Vue的实例上定义$data和$props属性，并且禁用了这两个属性的set方法，即不可以修改其值。比较简单，不多说了。
接着`Vue.prototype.$set = set`,在实例上定义了$set方法，这个方法在开发中经常遇到，根据官网的解释
>向响应式对象中添加一个属性，并确保这个新属性同样是响应式的，且触发视图更新。它必须用于向响应式对象上添加新属性，因为 Vue 无法探测普通的新增属性 (比如 this.myObject.newProperty = 'hi')

知道了方法的作用，我们再来看源码，就会简单的多
```
export function set (target: Array<any> | Object, key: any, val: any): any {
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key)
    target.splice(key, 1, val)
    return val
  }
  if (hasOwn(target, key)) {
    target[key] = val
    return val
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  if (!ob) {
    target[key] = val
    return val
  }
  defineReactive(ob.value, key, val)
  ob.dep.notify()
  return val
}
```
从代码看，方法判断要添加属性的target是数组还是对象，如果是数组，则改变数组的长度，将值添加进去。如果不是数组，看target中是否存在要设置的字段，如果存在，则修改其值。如果不存在，检查target上是否存在观察者对象，没有说明不需要响应式，直接赋值。如果有这说明对象是响应式的，则在响应式的target上定义字段，并通知更新，促使页面重新渲染。

设置完set，`Vue.prototype.$delete = del`，接着设置了实例方法$delete,
>删除对象的属性。如果对象是响应式的，确保删除能触发更新视图。这个方法主要用于避开 Vue 不能检测到属性被删除的限制，但是你应该很少会使用它。

删除对象上对应的字段。来看下源码
```
export function del (target: Array<any> | Object, key: any) {
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  if (!hasOwn(target, key)) {
    return
  }
  delete target[key]
  if (!ob) {
    return
  }
  ob.dep.notify()
}
```
同样，如果是数组，则从数组中移除指定索引的元素，如果是对象，则删除对象上的字段，并且如果是响应式的，通知watcher更新。

最后，为实例添加了$watch 方法，该方法在initState中有讲解。
后边的eventsMixin中的主要方法，在initState中也已经学习过了，直接跳过。