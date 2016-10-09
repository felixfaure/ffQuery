(function(global) {
  //NodeList to array
  function toArray(list) {
    return list ? Array.prototype.slice.call(list) : [];
  }

  //Select only the first node (or #id)
  function $(selector, container) {
    if (selector.indexOf('#') === 0) return document.getElementById(selector.substr(1, selector.length));
    return (container || document).querySelector(selector);
  };

  //Select all the node and convert to array
  function $$(selector, container) {
    return toArray( (container || document).querySelectorAll(selector) );
  }

  //Siblings
  function siblings(el) {
    return Array.prototype.filter.call(el.parentNode.children, function(child){
      return child !== el;
    });
  }

  //Ajax
  function ajax(args) {
    // args { url, params, json, method, before, success, error, always }
    // For POST args.params must be a formData
    if(args.before) {
      args.before();
    }
    var request = new XMLHttpRequest();
    if(args.method.toLowerCase() == "post") {
      request.open(args.method, args.url, true);
    } else {
      args.params = args.params ? ((args.url.indexOf('?') === -1 ? '?' : '&') + args.params) : '';
      request.open(args.method, encodeURI(args.url + args.params), true);
    }
    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
        // Success!
        var data = args.json ? JSON.parse(request.responseText) : request.responseText;
        if(args.success) {
          args.success(data);
        }
        if(args.always) {
          args.always(data);
        }
      } else {
        // We reached our target server, but it returned an error
        if(args.error) {
          args.error();
        }
        if(args.always) {
          args.always(false);
        }
      }
    };
    request.onerror = function() {
      // There was a connection error of some sort
      if(args.error) {
        args.error();
      }
      if(args.always) {
        args.always(false);
      }
    };
    if(args.method.toLowerCase() == "post") {
      request.send(args.params);
    } else {
      request.send();
    }
  }

  global.$ = $;
  global.$$ = $$;
  global.ff = {
    "toArray": toArray,
    "siblings": siblings,
    "ajax": ajax
  };

})(this);
