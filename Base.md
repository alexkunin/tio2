**Disclaimer:** for the sake of simplicity we use term "class" which means "JavaScript constructor with custom prototype".

Base is a base class that introduces some sugar syntax for prototypal inheritance.

To create a class and then subclass it, we can do the following (note custom class property -- "baseConstructor", which allows to walk hierarchy):

```
var A = TiO2.Base.extend({
    method1:function () {
        alert('A.method1');
    }
});

var B = A.extend({
    method2:function () {
        alert('B.method2');
    }
});

var a = new A();
var b = new B();

// Some true statements:

a.constructor === A;
b.constructor === B;

A.baseConstructor === Base;
B.baseConstructor === A;

a.isA(TiO2.Base);
b.isA(A);
b.isA(TiO2.Base);
!a.isA(B);

// This one is safer to call, but only Base-inherited classe's will be checked deeply:
TiO2.isA(a, TiO2.Base);
TiO2.isA(b, A);
TiO2.isA(b, TiO2.Base);
!TiO2.isA(a, B);
```

If you want to specify some custom constructor function, you can do it like this:

```
var B = A.extend({
    constructor:function (arg1) {
        this.arg1 = arg1;
        this.method1();
    }
});
```

If there is no explicit constructor, default one is provided, and it looks extactly like this:

```
var B = A.extend({
    constructor:function () {
        A.apply(this, arguments);
    }
});
```

There is TiO2.extend(baseConstructor, proto) function which allows you to inherit from any non-Base class. E.g. this is how Base class is defined:

```
TiO2.Base = TiO2.extend(Object, {
    isA:function () {
        // some fancy code
    }
});
```