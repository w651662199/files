# mergeOptions

合并两个选项，并返回。

>Merge two option objects into a new one.
>Core utility used in both instantiation and inheritance.

先看下源码中关于该方法的注释，mergeOptions的功能是合并两个options对象,并生成一个新的对象。是实例化和继承中使用的核心方法。可见mergeOptions方法的重要性。


```
// src/core/util/options.js
export function mergeOptions (
  parent: Object,
  child: Object,
  vm?: Component
): Object {
  if (process.env.NODE_ENV !== 'production') {
    // 检查组件名称是否合法，是否使用slot与component两个关键字
    checkComponents(child)
  }
  // 如果child是构造函数，则重新取options赋值给child
  if (typeof child === 'function') {
    child = child.options
  }
  // 规范化props选项
  normalizeProps(child, vm)
  // 规范化inject选项
  normalizeInject(child, vm)
  // 规范化directives选项
  normalizeDirectives(child)
  const extendsFrom = child.extends
  // 递归调用，将child的扩展合并到parent对应的选项中
  if (extendsFrom) {
    parent = mergeOptions(parent, extendsFrom, vm)
  }
  // 递归调用，将子组件的mixin合并到parent对应的选项中
  if (child.mixins) {
    for (let i = 0, l = child.mixins.length; i < l; i++) {
      parent = mergeOptions(parent, child.mixins[i], vm)
    }
  }
  // 新的结果options
  const options = {}
  let key
  // 首先将parent中选项添加到结果options中
  for (key in parent) {
    mergeField(key)
  }
  // 将child中选项合并到结果options中
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key)
    }
  }
  function mergeField (key) {
    const strat = strats[key] || defaultStrat
    options[key] = strat(parent[key], child[key], vm, key)
  }
  return options
}
```

首先看传入的三个参数，parent,child,vm，这三个参数分别代表的是该实例构造函数上的options,实例化时传入的options,vm实例本身。

```
  if (process.env.NODE_ENV !== 'production') {
    checkComponents(child)
  }
```
这段代码主要是判断当前环境是不是生产环境，如果不是，则调用checkComponents方法来检查组件名称是否是可用名称。我们来看看checkComponents的逻辑。

```
function checkComponents (options: Object) {
  for (const key in options.components) {
    validateComponentName(key)
  }
}

export function validateComponentName (name: string) {
  if (!/^[a-zA-Z][\w-]*$/.test(name)) {
    warn(
      'Invalid component name: "' + name + '". Component names ' +
      'can only contain alphanumeric characters and the hyphen, ' +
      'and must start with a letter.'
    )
  }
  if (isBuiltInTag(name) || config.isReservedTag(name)) {
    warn(
      'Do not use built-in or reserved HTML elements as component ' +
      'id: ' + name
    )
  }
}
```

如果child的options(实例化传入的options)有components属性。如下面这种情况

```
var vm = new Vue({
  el: document.getElementById('app'),
  components: {
    subVm
  }
});
```

那么就调用validateComponentName来验证传入的组件名称是否符合以下特征。

1.包含数字，字母，下划线，连接符，并且以字母开头
2.是否和html标签名称或svg标签名称相同
3.是否和关键字名称相同，如undefined, infinity等


下面看下几个规范化方法
## normalizeProps

```
function normalizeProps (options: Object, vm: ?Component) {
  const props = options.props
  if (!props) return
  const res = {}
  let i, val, name
  if (Array.isArray(props)) {
    i = props.length
    while (i--) {
      val = props[i]
      if (typeof val === 'string') {
        name = camelize(val)
        res[name] = { type: null }
      } else if (process.env.NODE_ENV !== 'production') {
        warn('props must be strings when using array syntax.')
      }
    }
  } else if (isPlainObject(props)) {
    for (const key in props) {
      val = props[key]
      name = camelize(key)
      res[name] = isPlainObject(val)
        ? val
        : { type: val }
    }
  } else if (process.env.NODE_ENV !== 'production') {
    warn(
      `Invalid value for option "props": expected an Array or an Object, ` +
      `but got ${toRawType(props)}.`,
      vm
    )
  }
  options.props = res
}
```

在子类接收父类的数据时，可以通过props进行传递，在上边方法中，统一将props处理成对象。
首先明确这两个方法里的参数是什么，options传入的是child,即实例化时传入的options。vm是实例。
```
  const props = options.props
  if (!props) return
  const res = {}
  let i, val, name
```
上面的代码主要是声明一些变量。res用来存放修改后的props,最后把res赋给新的props。下面的逻辑可以分为两种情况来考虑

### props是数组
当props是数组时，类似这样
```
var subVm = Vue.component('comp-a', {
  props: ['id'],
  template: '<span>{{type}}</span>',
});
```
处理逻辑是，while遍历数组，把数组的每一项的值作为res对象的key，value值等于{type: null},即把上面例子中的['postTitle']转换成下面这种形式
```
{
  id: {
    type: null
  }
}
```

### props是对象
当props是对象时，类似这种
```
var subVm = Vue.component('comp-a', {
  props: {
    id: {
      type: Number,
      required: true
    }
  },
  template: '<span>{{type}}</span>',
});
```
这种情况的处理逻辑是遍历对象，先把对象的key值转换成驼峰的形式。然后再判断对象的值，如果是纯对象（即调用object.prototype.toString方法的结果是[object Object]）,则直接把对象的值赋值给res,如果不是,则把{ type: 对象的值}赋给res。最终上面这种形式会转换成
```
{
  id: {
    type: Number,
    required: true
  }
}
```
如果传入的props不是纯对象也不是数组，且当前环境也不是生产环境，则抛出警告。
```
  if (process.env.NODE_ENV !== 'production') {
    warn(
      `Invalid value for option "props": expected an Array or an Object, ` +
      `but got ${toRawType(props)}.`,
      vm
    )
  }
```
最后，把处理过的props重新赋值给options.props。

## normalizeInject

normalizeInject逻辑与normalizeProps类似
```
function normalizeInject (options: Object, vm: ?Component) {
  const inject = options.inject
  if (!inject) return
  const normalized = options.inject = {}
  if (Array.isArray(inject)) {
    for (let i = 0; i < inject.length; i++) {
      normalized[inject[i]] = { from: inject[i] }
    }
  } else if (isPlainObject(inject)) {
    for (const key in inject) {
      const val = inject[key]
      normalized[key] = isPlainObject(val)
        ? extend({ from: key }, val)
        : { from: val }
    }
  } else if (process.env.NODE_ENV !== 'production') {
    warn(
      `Invalid value for option "inject": expected an Array or an Object, ` +
      `but got ${toRawType(inject)}.`,
      vm
    )
  }
}
```

这个方法同props的功能一致，都是将选项统一处理为对象

```
function normalizeDirectives (options: Object) {
  const dirs = options.directives
  if (dirs) {
    for (const key in dirs) {
      const def = dirs[key]
      if (typeof def === 'function') {
        dirs[key] = { bind: def, update: def }
      }
    }
  }
}
```

这个方法处理指令，如果指令是函数的话，则为其定义bind，和update钩子函数。

接着主流程往下看
```
  const extendsFrom = child.extends
  if (extendsFrom) {
    parent = mergeOptions(parent, extendsFrom, vm)
  }
  if (child.mixins) {
    for (let i = 0, l = child.mixins.length; i < l; i++) {
      parent = mergeOptions(parent, child.mixins[i], vm)
    }
  }
```

这段代码的处理的逻辑是，当传入的options里有mixin或者extends属性时，再次调用mergeOptions方法合并mixins和extends里的内容到实例的构造函数options上（即parent options）比如下面这种情况

```
var subVm = Vue.component('comp-a', {
  mixin: [mixins],
  extends: customCom,
  template: '<span>{{type}}</span>',
});
var mixins = {
  created: function() {
    console.log('mixin created');
  }
}
var customCom = {
  created: function() {
    console.log('extend created');
  },
  methods: {
    hello: function() {
        console.log('hello');
    }
  }
}
```

就会把传入的created钩子处理函数，还有methods方法提出来去和parent options做合并处理。
弄明白了这点我们继续回到mergeOptions的代码
```
  const options = {}
  let key
```

变量options存储合并之后的options，变量key存储parent options和child options上的key值。
接下来的部分算是mergeOptions方法的核心处理部分了
```
  for (key in parent) {
    mergeField(key)
  }
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key)
    }
  }
  function mergeField (key) {
    const strat = strats[key] || defaultStrat
    options[key] = strat(parent[key], child[key], vm, key)
  }
```
前两段for循环代码大同小异，都是遍历options上的key值，然后调用mergeField方法来处理options。mergeField方法中出现了一个变量strats和defaultStrat。这两个变量存储的就是我们的合并策略,我们先来看看defaultStrat
```
const defaultStrat = function (parentVal: any, childVal: any): any {
  return childVal === undefined
    ? parentVal
    : childVal
}
```

defaultStrat的逻辑是，如果child上该属性值存在时，就取child上的该属性值，如果不存在，则取parent上的该属性值。现在我们知道默认的合并策略是什么了，接下来看其他的合并策略。我们来看看strats里都有哪些属性？

![strats](./img/mergeOptionsStrats.png 'strats')

上图就是strats中所有的策略了。粗略看起来里面的内容非常的多，如果细细分析会发现，其实总结起来无非就是几种合并策略。下面分别为大家介绍

### 钩子函数策略

所有关于钩子函数的策略，其实都是调用mergeHook方法。
```
LIFECYCLE_HOOKS.forEach(hook => {
  strats[hook] = mergeHook
})


function mergeHook (
  parentVal: ?Array<Function>,
  childVal: ?Function | ?Array<Function>
): ?Array<Function> {
  return childVal
    ? parentVal
      ? parentVal.concat(childVal)
      : Array.isArray(childVal)
        ? childVal
        : [childVal]
    : parentVal
}
```
mergeHook采用了一个嵌套三元表达式来控制最后的返回值。下面我们来解析这段三元表达式

1.child options上不存在该属性，parent options上存在,则返回parent上的属性。
2.child和parent都存在该属性，则返回concat之后的属性
3.child上存在该属性，parent不存在，且child上的该属性是Array，则直接返回child上的该属性
4.child上存在该属性，parent不存在，且child上的该属性不是Array，则把该属性先转换成Array,再返回。

### props/methods/inject/computed的策略
介绍完了钩子函数的合并策略，我们接下来看props,methods,inject,computed等属性的合并策略。

```
strats.props =
strats.methods =
strats.inject =
strats.computed = function (
  parentVal: ?Object,
  childVal: ?Object,
  vm?: Component,
  key: string
): ?Object {
  if (childVal && process.env.NODE_ENV !== 'production') {
    assertObjectType(key, childVal, vm)
  }
  if (!parentVal) return childVal
  const ret = Object.create(null)
  extend(ret, parentVal)
  if (childVal) extend(ret, childVal)
  return ret
}
```
这个合并方法逻辑很简单，如果child options上这些属性存在，则先判断它们是不是对象。
（1）如果parent options上没有该属性，则直接返回child options上的该属性
（2）如果parent options和child options都有，则合并parent options和child options并生成一个新的对象。(如果parent和child上有同名属性，合并后的以child options上的为准)

### components/directives/filters的合并策略

```
function mergeAssets (
  parentVal: ?Object,
  childVal: ?Object,
  vm?: Component,
  key: string
): Object {
  const res = Object.create(parentVal || null)
  if (childVal) {
    process.env.NODE_ENV !== 'production' && assertObjectType(key, childVal, vm)
    return extend(res, childVal)
  } else {
    return res
  }
}
```

1.如果parent上有该选项，以parent options创建一个新对象，如果没有则创建一个空对象。
2.如果child上有该选项，则将parent和child合并返回，没有的话直接返回parent

### data和provide的策略

```
strats.data = function (
  parentVal: any,
  childVal: any,
  vm?: Component
): ?Function {
  if (!vm) {
    if (childVal && typeof childVal !== 'function') {
      process.env.NODE_ENV !== 'production' && warn(
        'The "data" option should be a function ' +
        'that returns a per-instance value in component ' +
        'definitions.',
        vm
      )

      return parentVal
    }
    return mergeDataOrFn(parentVal, childVal)
  }

  return mergeDataOrFn(parentVal, childVal, vm)
}

export function mergeDataOrFn (
  parentVal: any,
  childVal: any,
  vm?: Component
): ?Function {
  if (!vm) {
    // in a Vue.extend merge, both should be functions
    if (!childVal) {
      return parentVal
    }
    if (!parentVal) {
      return childVal
    }
    // when parentVal & childVal are both present,
    // we need to return a function that returns the
    // merged result of both functions... no need to
    // check if parentVal is a function here because
    // it has to be a function to pass previous merges.
    return function mergedDataFn () {
      return mergeData(
        typeof childVal === 'function' ? childVal.call(this, this) : childVal,
        typeof parentVal === 'function' ? parentVal.call(this, this) : parentVal
      )
    }
  } else {
    return function mergedInstanceDataFn () {
      // instance merge
      const instanceData = typeof childVal === 'function'
        ? childVal.call(vm, vm)
        : childVal
      const defaultData = typeof parentVal === 'function'
        ? parentVal.call(vm, vm)
        : parentVal
      if (instanceData) {
        return mergeData(instanceData, defaultData)
      } else {
        return defaultData
      }
    }
  }
}
```
这个合并策略可以分成两种情况来考虑。
第一种情况，当前调用mergeOptions操作的是vm实例（调用new新建vue实例触发mergeOptions方法）
```
    return function mergedInstanceDataFn () {
      // instance merge
      const instanceData = typeof childVal === 'function'
        ? childVal.call(vm, vm)
        : childVal
      const defaultData = typeof parentVal === 'function'
        ? parentVal.call(vm, vm)
        : parentVal
      if (instanceData) {
        return mergeData(instanceData, defaultData)
      } else {
        return defaultData
      }
    }
```

如果新建实例时传入的options上有data属性，则调用mergeData方法合并实例上的data属性和其构造函数options上的data属性（如果有的话）

第二种情况，当前调用mergeOptions操作的不是vm实例（即通过Vue.extend/Vue.component调用了mergeOptions方法）
```
  if (!vm) {
    // in a Vue.extend merge, both should be functions
    if (!childVal) {
      return parentVal
    }
    if (!parentVal) {
      return childVal
    }
    // when parentVal & childVal are both present,
    // we need to return a function that returns the
    // merged result of both functions... no need to
    // check if parentVal is a function here because
    // it has to be a function to pass previous merges.
    return function mergedDataFn () {
      return mergeData(
        typeof childVal === 'function' ? childVal.call(this, this) : childVal,
        typeof parentVal === 'function' ? parentVal.call(this, this) : parentVal
      )
    }
  }
```

在这种情况下，其处理逻辑也是类似的。如果当前实例options或者构造函数options上有一个没有data属性，则返回另一个的data属性，如果两者都有，则同样调用mergeData方法处理合并。

```
function mergeData (to: Object, from: ?Object): Object {
  if (!from) return to
  let key, toVal, fromVal
  const keys = Object.keys(from)
  for (let i = 0; i < keys.length; i++) {
    key = keys[i]
    toVal = to[key]
    fromVal = from[key]
    if (!hasOwn(to, key)) {
      set(to, key, fromVal)
    } else if (isPlainObject(toVal) && isPlainObject(fromVal)) {
      mergeData(toVal, fromVal)
    }
  }
  return to
}
```

mergeData的逻辑是，如果from对象中有to对象里没有的属性，则调用set方法，（这里的set就是Vue.$set，先可以简单理解为对象设置属性。之后会细讲）如果from和to中有相同的key值，且key对应的value是对象，则会递归调用mergeData方法，否则以to的值为准，最后返回to对象。这里我们就讲完了data的合并策略。

最终返回options。

最后引用一张网上的图片

![mergeOptions](./img/mergeOptions.jpg 'mergeOptions')


本文参考文章

[mergeOptions-1](https://segmentfault.com/a/1190000014707956)

[mergeOptions-2](https://segmentfault.com/a/1190000014738314)