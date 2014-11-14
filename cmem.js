'use strict';

var patterns = {};
var slice = Array.prototype.slice;

module.exports = create();

function create() {
  Object.defineProperties(cmem, {
    create: { value: create },
    clear: { value: clear },
    unit: { value: unit },
    iterator: { value: iterator },
    memos: { value: [] },
    noop: { value: _silent }
  });

  return cmem;

  function cmem(fn) {
    var result = make(fn);
    cmem.memos.push(result);
    return result;
  }
}

function make(fn) {
  var $calls = [], fn_;

  Object.defineProperties(ctx, {
    $clear: { value: $clear },
    $fn: { value: $fn },
    $unit: { value: $unit },

    $map: { value: $map },
    $filter: { value: $filter },
    $select: { value: $select },

    $calls: { value: $calls },
    $last: { value: null, writable: true },
    $args: { value: null, writable: true },
    $this: { value: null, writable: true },
    $count: { value: 0, writable: true },
  });

  return $clear();

  function ctx() {
    ctx.$count = $calls.push(ctx.$last = {
      $args: ctx.$args = arguments,
      $this: ctx.$this = this
    });

    return (fn_ || fn || _silent).apply(this, arguments);
  }

  function $clear() {
    $calls.length = 0;
    ctx.$last = null;
    ctx.$args = null;
    ctx.$this = null;
    ctx.$count = 0;

    return ctx;
  }

  function $fn(fn) {
    return (fn_ = fn, ctx);
  }

  function $unit(unit_) {
    return $fn(unit(unit_));
  }

  function $map() {
    return _iterate($calls, 'map', arguments, ctx, this);
  }

  function $filter() {
    return _iterate($calls, 'filter', arguments, ctx, this);
  }

  function $select(filter, map) {
    var args = slice.call(arguments, 1), result;
    args[0] = filter;

    result = $filter.apply(this, args);

    if (map) {
      args[0] = map;
      result = _iterate(result, 'map', args, ctx, this);
    }

    return result;
  }
}

function iterator(pattern) {
  var result, fn = patterns[pattern];
  var args = slice.call(arguments, 1);

  if ( ! fn) {
    fn = Function('$item,$i,$list,$','with($item)return '+ pattern);
    patterns[pattern] = fn;
  }

  if (args.length) {
    result = function iterator(item, i, list) {
      return fn.call(this, item, i, list, args);
    };
  } else {
    result = fn;
  }

  return result;
}

function unit(value) {
  return function bond() {
    return value;
  };
}

function clear() {
  var a = this.memos, i = a.length;
  while (i--) a[i].$clear();
}

function _iterate(list, action, args, ctx, self) {
  var pattern = args[0];

  if (typeof pattern == 'function') {
    return list[action].apply(list, args);
  } else {
    return list[action](iterator.apply(null, args), ctx !== self ? self : undefined);
  }
}

function _silent() {}
