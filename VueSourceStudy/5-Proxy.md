# Proxy

这里主要用到了Proxy，我们首先来看看Proxy是什么
>The Proxy object is used to define custom behavior for fundamental operations (e.g. property lookup, assignment, enumeration, function invocation, etc).

这里引用了MDN的定义，定义了Proxy对象用于为基本操作定义自定义行为，（例如查找、赋值、枚举、函数调用等）。

再来看下Proxy的语法
```
let p = new Proxy(target, handler);
```

Proxy构造函数接收两个参数，

- target：代理虚拟化的对象。它通常用作代理的存储后端。根据目标验证关于对象不可扩展性或不可配置属性的不变量（保持不变的语义）。
- handler：包含陷阱（traps）的占位符对象。

看定义可能不太明白，我们从具体的应用中来了解。

## 基础用法

我们可以使用Proxy拦截一些操作，比如get,set
```
let handler = {
  get: function(target, props) {
    return props in target ? target[props] : `${props} is not defined`;
  }
};
let p = {
  name: 'Amy'
};
p = new Proxy(p, handler);
console.log(p.name); // Amy
console.log(p.age);  // age is not defined
```

从这个例子我们可以看出，当对象p使用代理时，每次get操作都会被代理拦截。
基于这个功能，我们就可以对私有属性的操作进行拦截
```
let handler = {
  get: function(target, props) {
    if (props === '_id') {
      throw new Error('Cannot access private properties!')
    } else {
      return props in target ? target[props] : `${props} is not defined`;
    }
  }
};
let p = {
  _id: 1,
  name: 'Amy'
};
p = new Proxy(p, handler);
console.log(p.name); // Amy
console.log(p._id);  // Uncaught Error: Cannot access private properties!
```

在这个例子中，我们对_id属性进行了get的拦截，这样，当外部想要访问时就会抛出一个错误。

通过代理，我们还可以通过set验证属性的赋值
```
let handler = {
  set: function(target, prop, value) {
    if (prop == 'age') {
      if (!Number.isNumber(value)) {
        throw new TypeError('The age is not an integer')
      }
      if (value > 200) {
        throw new RangeError('The age seems invalid');
      }
    }
    target[prop] = value;
  }
};
let p = {
  name: 'Amy'
};
p = new Proxy(p, handler);
p.age = 20; // 正常执行
p.age = '20'; // Uncaught TypeError: The age is not an integer
p.age = 201; // Uncaught RangeError: The age seems invalid
```

上边例子中我们通过代理，自定义了set操作，当值不合理时，抛出错误。

## 无操作转发代理
当我们使用一个JavaScript原生对象时，代理会将所有应用到它的操作转发到这个对象上。
我们来看下下面的例子。
```
let target = {};
let p = new Proxy(target, {});
p.name = 'Amy';
console.log(target.name); // Amy
```
此时我们发现，对p进行操作，相应的target也变换了。接下了继续试验
```
let q = new Proxy(target, {});
console.log(q.name); //  Amy
```
这里，我们只是通过target新建了一个代理q，但去却具有name属性。此时我们就可以理解定义里所说的，‘代理会将所有应用到它的操作转发到这个对象上’。即，p、q对象都应用到了target，所有对p、q的所有操作都会转发到target上，即在target上做了同一个操作。

