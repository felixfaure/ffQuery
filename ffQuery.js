(function(root, factory) {
  root.ffQuery = root.$ = factory();
})(this, function() {

  var d          = document,
      w          = window,
      docEl      = d.documentElement,
      ArrayProto = Array.prototype,
      slice      = ArrayProto.slice,
      filter     = ArrayProto.filter,
      push       = ArrayProto.push;

  //==================================================================================
  //Core
  //==================================================================================
  var noop = function(){},
      isFunction = function(item){ return typeof item === typeof noop; },
      isString = function(item) { return typeof item === typeof ''; };

  var idMatch    = /^#[\w-]*$/,
      classMatch = /^\.[\w-]*$/,
      htmlMatch =  /<.+>/,
      singlet    = /^\w+$/;

  function find(selector,context) {
    context = context || d;
    // If context is a ffQuery collection
    if ( context.ffQuery && context !== w ) {
      context = context[0];
    }
    var elems = (
          classMatch.test(selector) ?
            context.getElementsByClassName(selector.slice(1)) :
              singlet.test(selector) ?
                context.getElementsByTagName(selector) :
                context.querySelectorAll(selector)
        );
    return elems;
  }

  var frag, tmp;
  function parseHTML(str) {
    frag = frag || d.createDocumentFragment();
    tmp = tmp || frag.appendChild(d.createElement('div'));
    tmp.innerHTML = str;
    return tmp.childNodes;
  }

  function onReady(fn) {
    if ( d.readyState !== 'loading' ) { fn(); }
    else { d.addEventListener('DOMContentLoaded', fn); }
  }

  function Init(selector,context){

    if ( !selector ) { return this; }

    // If already a ffQuery collection, don't do any further processing
    if ( selector.ffQuery && selector !== w ) { return selector; }

    var elems = selector,
        i = 0,
        length;

    if ( isString(selector) ) {
      elems = (
        idMatch.test(selector) ?
          // If an ID use the faster getElementById check
          d.getElementById(selector.slice(1)) :
          htmlMatch.test(selector) ?
            // If HTML, parse it into real elements
            parseHTML(selector) :
              // Body ?
              selector === 'body' ?
              d.body :
                // else use `find`
                find(selector,context)
        );

    // If function, use as shortcut for DOM ready
    } else if ( isFunction(selector) ) {
      onReady(selector); return this;
    }

    if ( !elems ) { return this; }

    // If a single DOM element is passed in or received via ID, return the single element
    if ( elems.nodeType || elems === w || elems === docEl ) {
      this[0] = elems;
      this.length = 1;
    } else {
      // Treat like an array and loop through each item.
      length = this.length = elems.length;
      for( ; i < length; i++ ) { this[i] = elems[i]; }
    }

    return this;
  }

  function ffQuery(selector,context) {
    return new Init(selector,context);
  }

  var fn = ffQuery.fn = ffQuery.prototype = Init.prototype = {
    constructor: ffQuery,
    ffQuery: true,
    length: 0,
    push: push,
    splice: ArrayProto.splice,
    map: ArrayProto.map,
    init: Init
  };


  //==================================================================================
  //Util
  //Need -
  //==================================================================================
  // Extends target object with properties from the source object. If no target is provided, ffQuery itself will be extended.
  ffQuery.extend = fn.extend = function(target) {
    target = target || {};

    var args = slice.call(arguments),
        length = args.length,
        i = 1;

    if ( args.length === 1) {
      target = this;
      i = 0;
    }

    for (; i < length; i++) {
      if (!args[i]) { continue; }
      for (var key in args[i]) {
        if ( args[i].hasOwnProperty(key) ) { target[key] = args[i][key]; }
      }
    }

    return target;
  };

  // Iterates through a collection and calls the callback method on each.
  function each(collection, callback) {
    var l = collection.length,
        i = 0;

    for (; i < l; i++) {
      if ( callback.call(collection[i], collection[i], i, collection) === false ) { break; }
    }
  }

  // Checks a selector against an element, returning a boolean value for match.
  function matches(el, selector) {
    return el && el.matches(selector);
  }

  // Remove duplicate
  function unique(collection) {
    return ffQuery(slice.call(collection).filter(function (item, index, self) {
      return self.indexOf(item) === index;
    }));
  }

  ffQuery.extend({
    parseHTML: parseHTML,
    noop: noop,
    isFunction: isFunction,
    isString: isString,
    isArray: Array.isArray,
    isNumeric: function (n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    },
    merge: function (first, second) {
      var len = +second.length, i = first.length, j = 0;
      for (; j < len; i++, j++) {
        first[i] = second[j];
      }
      first.length = i;
      return first;
    },
    each: each,
    matches: matches,
    unique: unique
  });


  //==================================================================================
  //Collection
  //Need fn.parent, fn.children
  //==================================================================================
  fn.extend({
    add: function (selector, context) {
      return unique(ffQuery.merge(this, ffQuery(selector, context)));
    },

    each: function (callback) {
      each(this, callback);
      return this;
    },

    get: function (index) {
      if (index === undefined) {
        return slice.call(this);
      }
      return (index < 0 ? this[index + this.length] : this[index]);
    },

    eq: function (index) {
      return ffQuery(this.get(index));
    },

    first: function () {
      return this.eq(0);
    },

    last: function () {
      return this.eq(-1);
    },

    filter: function (selector) {
      return ffQuery(filter.call(this, (isString(selector) ? function (e) {
        return matches(e, selector);
      } : selector)));
    },

    index: function (elem) {
      var child = elem ? ffQuery(elem)[0] : this[0],
          collection = elem ? this : ffQuery(child).parent().children();
      return slice.call(collection).indexOf(child);
    }
  });


  //==================================================================================
  //Traversal
  //Need fn.each
  //==================================================================================
  function directCompare(el, selector) {
    return el === selector;
  }

  fn.extend({
    children: function (selector) {
      var elems = [];
      this.each(function (el) {
        push.apply(elems, el.children);
      });
      elems = unique(elems);

      return (!selector ? elems : elems.filter(function (v) {
        return matches(v, selector);
      }));
    },

    parent: function () {
      var result = this.map(function (item) {
        return item.parentElement || d.body.parentNode;
      });
      return unique(result);
    },

    closest: function (selector) {
      var elems = [];
      this.each(function (el) {
        push.apply(elems, ffQuery(el.closest(selector)));
      });
      return unique(elems);
    },

    is: function (selector) {
      if (!selector) {
        return false;
      }

      var match = false,
          comparator = (isString(selector) ? matches : selector.ffQuery ? function (el) {
            return selector.is(el);
          } : directCompare);

      this.each(function (el, i) {
        match = comparator(el, selector, i);
        return !match;
      });

      return match;
    },

    not: function (selector) {
      return filter.call(this, function (el) {
        return !matches(el, selector);
      });
    },

    find: function (selector) {
      if (!selector) {
        return ffQuery();
      }

      var elems = [];
      this.each(function (el) {
        push.apply(elems, find(selector, el));
      });

      return unique(elems);
    },

    has: function (selector) {
      return filter.call(this, function (el) {
        return ffQuery(el).find(selector).length !== 0;
      });
    },

    next: function () {
      return ffQuery(this[0].nextElementSibling);
    },

    prev: function () {
      return ffQuery(this[0].previousElementSibling);
    },

    parents: function (selector) {
      var last, result = [];

      this.each(function (item) {
        last = item;

        while (last !== d.body.parentNode) {
          last = last.parentElement;

          if (!selector || (selector && matches(last, selector))) {
            result.push(last);
          }
        }
      });

      return unique(result);
    },

    siblings: function () {
      var collection = this.parent().children(), el = this[0];

      return ffQuery(filter.call(collection, function (i) {
        return i !== el;
      }));
    }

  });


  //==================================================================================
  //Manipulation
  //Need fn.each
  //==================================================================================
  function insertElement(el, child, prepend) {
    if (prepend) {
      var first = el.childNodes[0];
      el.insertBefore(child, first);
    } else {
      el.appendChild(child);
    }
  }

  function insertContent(parent, child, prepend) {
    var str = isString(child);

    if (!str && child.length) {
      each(child, function (v) {
        return insertContent(parent, v, prepend);
      });
      return;
    }

    each(parent, str ? function (v) {
      return v.insertAdjacentHTML(prepend ? "afterbegin" : "beforeend", child);
    } : function (v, i) {
      return insertElement(v, (i === 0 ? child : child.cloneNode(true)), prepend);
    });
  }

  fn.extend({
    insertAfter: function (selector) {
      var _this = this;

      ffQuery(selector).each(function (el, i) {
        var parent = el.parentNode, sibling = el.nextSibling;
        _this.each(function (v) {
          parent.insertBefore((i === 0 ? v : v.cloneNode(true)), sibling);
        });
      });

      return this;
    },

    insertBefore: function (selector) {
      var _this2 = this;
      ffQuery(selector).each(function (el, i) {
        var parent = el.parentNode;
        _this2.each(function (v) {
          parent.insertBefore((i === 0 ? v : v.cloneNode(true)), el);
        });
      });
      return this;
    },

    after: function (selector) {
      ffQuery(selector).insertAfter(this);
      return this;
    },

    before: function (selector) {
      ffQuery(selector).insertBefore(this);
      return this;
    },

    append: function (content) {
      insertContent(this, content);
      return this;
    },

    appendTo: function (parent) {
      insertContent(ffQuery(parent), this);
      return this;
    },

    prepend: function (content) {
      insertContent(this, content, true);
      return this;
    },

    prependTo: function (parent) {
      insertContent(ffQuery(parent), this, true);
      return this;
    },

    clone: function () {
      return ffQuery(this.map(function (v) {
        return v.cloneNode(true);
      }));
    },

    html: function (content) {
      if (content === undefined) {
        return this[0].innerHTML;
      }
      var source = (content.nodeType ? content[0].outerHTML : content);
      return this.each(function (v) {
        return v.innerHTML = source;
      });
    },

    empty: function () {
      this.html("");
      return this;
    },

    remove: function () {
      return this.each(function (v) {
        return v.parentNode.removeChild(v);
      });
    },

    text: function (content) {
      if (content === undefined) {
        return this[0].textContent;
      }
      return this.each(function (v) {
        return v.textContent = content;
      });
    }
  });


  //==================================================================================
  //Attributes
  //Need fn.each
  //==================================================================================
  function getClasses(c) {
    return isString(c) && c.match(/\S+/g);
  }

  function classReg( className ) {
    return new RegExp("(^|\\s+)" + className + "(\\s+|$)");
  }

  function hasClass(v, c) {
    return (v.classList ? v.classList.contains(c) : classReg(c).test(v.className));
  }

  function addClass(v, c) {
    if (v.classList) {
      v.classList.add(c);
    } else if (!hasClass(v, c)) {
      v.className += " " + c;
    }
  }

  function removeClass(v, c) {
    if (v.classList) {
      v.classList.remove(c);
    } else {
      v.className = v.className.replace( classReg( c ), ' ' );
    }
  }

  fn.extend({
    hasClass: function (c) {
      var check = false, classes = getClasses(c);
      if (classes && classes.length) {
        this.each(function (v) {
          check = hasClass(v, classes[0]);
          return !check;
        });
      }
      return check;
    },

    addClass: function (c) {
      var classes = getClasses(c);
      return (classes ?
        this.each(function (v) {
          each(classes, function (c) { addClass(v, c); });
        }) :
        this
      );
    },

    removeClass: function (c) {
      var classes = getClasses(c);
      return (classes ?
        this.each(function (v) {
          each(classes, function (c) {
            removeClass(v, c);
          });
        }) :
        this
      );
    },

    toggleClass: function (c, state) {
      if (state !== undefined) {
        return this[state ? "addClass" : "removeClass"](c);
      }
      var classes = getClasses(c);
      return (classes ?
        this.each(function (v) {
          each(classes, function (c) {
            if (hasClass(v, c)) {
              removeClass(v, c);
            } else {
              addClass(v, c);
            }
          });
        }) :
        this
      );
    },

    attr: function (name, value) {
      if (!name) {
        return undefined;
      }

      if (isString(name)) {
        if (value === undefined) {
          return this[0] ? this[0].getAttribute(name) : undefined;
        }

        return this.each(function (v) {
          v.setAttribute(name, value);
        });
      }

      for (var key in name) {
        this.attr(key, name[key]);
      }

      return this;
    },

    removeAttr: function (name) {
      return this.each(function (v) {
        v.removeAttribute(name);
      });
    }
  });


  //==================================================================================
  //CSS
  //Need fn.each
  //==================================================================================
  var camelCase = (function () {
    var camelRegex = /(?:^\w|[A-Z]|\b\w)/g, whiteSpace = /[\s-_]+/g;
    return function (str) {
      return str.replace(camelRegex, function (letter, index) {
        return letter[index === 0 ? "toLowerCase" : "toUpperCase"]();
      }).replace(whiteSpace, "");
    };
  }());

  var getPrefixedProp = (function () {
    var cache = {},
        doc = document,
        div = doc.createElement("div"),
        style = div.style;

    return function (prop) {
      prop = camelCase(prop);
      if (cache[prop]) {
        return cache[prop];
      }

      var ucProp = prop.charAt(0).toUpperCase() + prop.slice(1),
          prefixes = ["webkit", "moz", "ms", "o"],
          props = (prop + " " + (prefixes).join(ucProp + " ") + ucProp).split(" ");

      each(props, function (p) {
        if (p in style) {
          cache[p] = prop = cache[prop] = p;
          return false;
        }
      });

      return cache[prop];
    };
  }());

  ffQuery.prefixedProp = getPrefixedProp;
  ffQuery.camelCase = camelCase;

  fn.extend({
    css: function (prop, value) {
      if (isString(prop)) {
        prop = getPrefixedProp(prop);
        return (
          arguments.length > 1 ?
          this.each(function (v) {
            return v.style[prop] = value;
          }) :
          w.getComputedStyle(this[0])[prop]);
      }

      for (var key in prop) {
        this.css(key, prop[key]);
      }

      return this;
    }

  });


  //==================================================================================
  //Data
  //Need fn.each, fn.attr, fn.removeAttr
  //==================================================================================
  var uid = ffQuery.uid = '_ffQuery'+Date.now();

  function getDataCache(node) {
    return (node[uid] = node[uid] || {});
  }

  function setData(node, key, value) {
    return (getDataCache(node)[key] = value);
  }

  function getData(node, key) {
    var c = getDataCache(node);
    if ( c[key] === undefined ) {
      c[key] = node.dataset ? node.dataset[key] : ffQuery(node).attr('data-'+key);
    }
    return c[key];
  }

  function removeData(node, key) {
    var c = getDataCache(node);
    if ( c ) { delete c[key]; }
    if ( node.dataset ) { delete node.dataset[key]; }
    else { ffQuery(node).removeAttr('data-' + name); }
  }

  fn.extend({
    data: function (name, value) {
      if (isString(name)) {
        return (
          value === undefined ?
          getData(this[0], name) :
          this.each(function (v) {
            return setData(v, name, value);
          })
        );
      }

      for (var key in name) {
        this.data(key, name[key]);
      }

      return this;
    },

    removeData: function (key) {
      return this.each(function (v) {
        return removeData(v, key);
      });
    }
  });


  //==================================================================================
  //Events
  //Need fn.getData, fn.setData, fn.each
  //==================================================================================
  function registerEvent(node, eventName, callback) {
    var eventCache = getData(node, "_ffQueryEvents") || setData(node, "_ffQueryEvents", {});
    eventCache[eventName] = eventCache[eventName] || [];
    eventCache[eventName].push(callback);
    node.addEventListener(eventName, callback);
  }

  function removeEvent(node, eventName, callback) {
    if (callback) {
      node.removeEventListener(eventName, callback);
    } else {
      var eventData = getData(node, "_ffQueryEvents");
      if(eventData) {
        var eventCache = getData(node, "_ffQueryEvents")[eventName];
        each(eventCache, function (event) {
          node.removeEventListener(eventName, event);
        });
        eventCache = [];
      }
    }
  }

  fn.extend({
    off: function (eventName, callback) {
      return this.each(function (v) {
        return removeEvent(v, eventName, callback);
      });
    },

    on: function (eventName, delegate, callback, runOnce) {
      var originalCallback;

      if (!isString(eventName)) {
        for (var key in eventName) {
          this.on(key, delegate, eventName[key]);
        }
        return this;
      }

      if (isFunction(delegate)) {
        callback = delegate;
        delegate = null;
      }

      if (eventName === "ready") {
        onReady(callback);
        return this;
      }

      if (delegate) {
        originalCallback = callback;
        callback = function (e) {
          var t = e.target;

          while (!matches(t, delegate)) {
            if (t === this) {
              return (t = false);
            }
            t = t.parentNode;
          }

          if (t) {
            originalCallback.call(t, e);
          }
        };
      }

      return this.each(function (v) {
        var finalCallback = callback;
        if (runOnce) {
          finalCallback = function () {
            callback.apply(this, arguments);
            removeEvent(v, eventName, finalCallback);
          };
        }
        registerEvent(v, eventName, finalCallback);
      });
    },

    one: function (eventName, delegate, callback) {
      return this.on(eventName, delegate, callback, true);
    },

    ready: onReady,

    trigger: function (eventName, data) {
      var evt = d.createEvent("HTMLEvents");
      evt.data = data;
      evt.initEvent(eventName, true, false);
      return this.each(function (v) {
        return v.dispatchEvent(evt);
      });
    }
  });


  //==================================================================================
  //Forms
  //Need fn.each
  //==================================================================================
  function encode(name, value) {
    return "&" + encodeURIComponent(name) + "=" + encodeURIComponent(value).replace(/%20/g, "+");
  }
  function isCheckable(field) {
    return field.type === "radio" || field.type === "checkbox";
  }

  var formExcludes = ["file", "reset", "submit", "button"];

  fn.extend({
    serialize: function () {
      var formEl = this[0].elements, query = "";

      each(formEl, function (field) {
        if (field.name && formExcludes.indexOf(field.type) < 0) {
          if (field.type === "select-multiple") {
            each(field.options, function (o) {
              if (o.selected) {
                query += encode(field.name, o.value);
              }
            });
          } else if (!isCheckable(field) || (isCheckable(field) && field.checked)) {
            query += encode(field.name, field.value);
          }
        }
      });

      return query.substr(1);
    },

    val: function (value) {
      if (value === undefined) {
        return this[0].value;
      } else {
        return this.each(function (v) {
          return v.value = value;
        });
      }
    }
  });


  //==================================================================================
  //Dimensions
  //Need -
  //==================================================================================
  function compute(el, prop) {
    return parseInt(w.getComputedStyle(el[0], null)[prop], 10) || 0;
  }

  each(["Width", "Height"], function (v) {
    var lower = v.toLowerCase();

    fn[lower] = function () {
      return this[0].getBoundingClientRect()[lower];
    };

    fn["inner" + v] = function () {
      return this[0]["client" + v];
    };

    fn["outer" + v] = function (margins) {
      return this[0]["offset" + v] + (margins ? compute(this, "margin" + (v === "Width" ? "Left" : "Top")) + compute(this, "margin" + (v === "Width" ? "Right" : "Bottom")) : 0);
    };
  });


  //==================================================================================
  //Offset
  //Need -
  //==================================================================================
  fn.extend({
    position: function () {
      var el = this[0];
      return {
        left: el.offsetLeft,
        top: el.offsetTop
      };
    },

    offset: function () {
      var rect = this[0].getBoundingClientRect();
      return {
        top: rect.top + w.pageYOffset - docEl.clientTop,
        left: rect.left + w.pageXOffset - docEl.clientLeft
      };
    },

    offsetParent: function () {
      return ffQuery(this[0].offsetParent);
    }
  });

  return ffQuery;
});
