# cmem

Small and basic function stubbing module. Primarily used in unit testing.

```js
var assert = require('assert');
var cmem = require('cmem');
var stub = cmem();
var object = { fn: stub };

object.fn(1);
stub(2);
object.fn(3);

assert.deepEqual(stub.$select('$this === $[0]', '$args[0]', object), [ 1, 2 ]);
```

## Installation

```bash
$ npm install cmem
```

## Features

- Function call registry
- Mapping and filtering arguments and contexts of function calls
- Function wrapping and switching
- Creating function with fixed result

## API

### cmem( [ fn ] )

Creates new `cmem` instance. Optional `fn` argument can be passed as wrapped function.

```js
setTimeout = cmem(setTimeout);
setTimeout(function () { console.log('after some time'); }, 100);
assert.equal(setTimeout.$count, 1);
assert.equal(setTimeout.$args[1], 100);
```

### cmem.create()

Creates new `cmem` factory.

### cmem.clear()

Clears all `cmem` instances.

### cmem.unit( value )

Helper method: creates function that always returns passed argument.

```js
assert.equal(cmem.unit('some value')(), 'some value');
```

### cmem.iterator( pattern, [ arg ], ... );

Helper method: creates iterator function from string. Usefull for `map`, `filter`, etc... array methods. 

```js
var iter = cmem.iterator('$item + $[0]', 1);
assert.deepEqual([ 1, 2, 3 ].map(iter), [ 2, 3, 4 ]);
```

Helper returns function constructed as this:

```js
function ($item, $i, $list, $) {
  // $item is value of array ($list) element at index ($i)
  // Last $ argument is array of arguments passed after pattern
  with ($item) return %pattern%;
}
```

### cmem.memos

List of `cmem` instances.

```js
assert.equal(cmem(), cmem.memos[0]);
```

### cmem.noop

Just empty function.

### cmem().$calls

Registry list of function calls.

```js
var object = { method: cmem() };
object.method(1, 2);
object.method(3, 4);

console.log(object.method.$calls);
// Output:
// [ { '$args': { '0': 1, '1': 2 },
//     '$this': { method: [Function: ctx] } },
//   { '$args': { '0': 3, '1': 4 },
//     '$this': { method: [Function: ctx] } } ]
```

### cmem().$count

Shortcut for `cmem().$calls.length`.

### cmem().$last

Shortcut for `(fn = cmem()).$calls[fn.$calls.length - 1]`.

### cmem().$args

Shortcut for `cmem().$last.$args`.

### cmem().$this

Shortcut for `cmem().$last.$this`.

### cmem().$clear()

Clears `cmem` instance call registry and resets counter.

```js
var fn = cmem();
fn();
assert.equal(fn.$count, 1);
fn.$clear();
assert.equal(fn.$count, 0);
```

### cmem().$fn( [ fn ] )

Switches function to passed one. If nothing passed `cmem(fn)` will be used.

```js
var inc = cmem(function (a) { return a + 1; });
assert.equal(inc(1), 2);

inc.$fn(function (a) { return a + 2; });
assert.equal(inc(1), 3);

inc.$fn();
assert.equal(inc(1), 2);
```

### cmem().$unit( value )

Switches function to one that returns passed value.

Shortcut to `cmem().$fn(cmem.unit(value))`.

```js
var inc = cmem(function (a) { return a + 1; });
assert.equal(inc(1), 2);

inc.$unit(1);
assert.equal(inc(1), 1);

inc.$unit(3);
assert.equal(inc(1), 3);

inc.$fn();
assert.equal(inc(1), 2);
```

### cmem().$map( patternOrFunction, [ arg ], ... )

Array map method shortcut for function calls.

```js
var multiplier = 3;

var fn = cmem();
fn(1, 2);
fn(2, 1);
fn(2, 2);

var map1 = fn.$calls.map(function (item) {
  return (item.$args[0] + item.$args[1]) * multiplier;
});

var map2 = fn.$map('($args[0] + $args[1]) * $[0]', multiplier);

assert.deepEqual(map1, map2);
```

### cmem().$filter( patternOrFunction, [ arg ], ... )

Array filter method shortcut for function calls.

```js
var fn = cmem();
var object1 = { method: fn };
var object2 = { method: fn };

object1.method(1);
object2.method(2);
object1.method(3);

assert.equal(fn.$filter('$this === $[0]', object1).length, 2);
assert.equal(fn.$filter('$this === $[0]', object2).length, 1);

// Same as:
assert.equal(fn.$calls.filter(function (item) {
  return item.$this === object1;
}).length, 2);

assert.equal(fn.$calls.filter(function (item) {
  return item.$this === object2;
}).length, 1);
```

### cmem().$select( filterPatternOrFunction, mapPatternOrFunction, [ arg ], ... )

Combines `$filter` and `$map` methods.

```js
var fn = cmem();
var object1 = { method: fn };
var object2 = { method: fn };

object1.method(1);
object2.method(2);
object1.method(3);

assert.deepEqual(fn.$select('$this === $[0]', '$args[0]', object1), [ 1, 3 ]);
assert.deepEqual(fn.$select('$this === $[0]', '$args[0]', object2), [ 2 ]);

// Same as:
assert.deepEqual(fn.$calls.filter(function (item) {
  return item.$this === object1;
}).map(function (item) {
  return item.$args[0];
}), [ 1, 3 ]);

assert.deepEqual(fn.$calls.filter(function (item) {
  return item.$this === object2;
}).map(function (item) {
  return item.$args[0];
}), [ 2 ]);
```

## License

[MIT](LICENSE)
