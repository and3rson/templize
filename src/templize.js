var Templize = function(source) {
    this.source = source;
};

Templize.prototype.renderChildren = function(context, element) {
    var results = [];

    var children = element.childNodes;

    for (var i = 0; i < children.length; i++) {
        var child = children[i];

        var content = this.render(context, child);

        if (content instanceof Array) {
            Array.prototype.push.apply(results, content);
        } else {
            results.push(content);
        }
    }

    return results;
};

Templize.prototype.resolve = function (obj, path) {
//    path.split('.').reduce(function (prev, curr) {
//        //return !safe ? prev[curr] : (prev ? prev[curr] : undefined)
//        return prev ? prev[curr] : undefined
//    }, obj || self);
    try {
        return new Function('ctx', 'return ' + path).call(null, obj);
    } catch(e) {
        throw new Error('Templize error: wrong variable or expression: "' + path + '"');
    }
};

Templize.prototype.render = function(context, element) {
    var self = this;

    context = context || {};

    context._internal = context._internal || {};

    if (!element) {
        var doc = document.createElement('div');

        doc.innerHTML = this.source;

        //doc.innerHTML = this.source.replace(/%\{([^}]+)\}/g, function (all, name) {
            //return self.resolve(context, name);
        //});

        return this.render(context, doc);
    }

    var tagName = element.nodeName;
    if (tagName == 'T') {
        tagName = element.className.toUpperCase();
    }

    if (tagName == 'ECHO') {
        //var varKey = element.attributes[0].name;
        var varKey = element.textContent.trim();
        var varValue = self.resolve(context, varKey);
        if (varValue.toString() == '[object Object]') {
            varValue = '[Object: ' + JSON.stringify(varValue) + ']';
        }
        return document.createTextNode(varValue);
    } else if (tagName == 'IF') {
        var cond = self.resolve(context, element.getAttribute('cond'));

        if (self.resolve(context, cond)) {
            return this.renderChildren(context, element);
        } else {
            return [];
        }
    } else if (tagName == 'LOOP') {
        var array_name = element.getAttribute('array');
        var object_name = element.getAttribute('object');
        var of_name = element.getAttribute('of');

        var iteratorFunction;

        if (array_name) {
            iteratorFunction = function(context, callback) {
                var array = self.resolve(context, array_name);
                if (!(Symbol.iterator in Object(array))) {
                    throw new Error('Templize error: ' + array_name + ' is not iterable.');
                }
                for (var arrayKey = 0; arrayKey < array.length; arrayKey++) {
                    var arrayValue = array[arrayKey];
                    callback(arrayKey, arrayValue, arrayKey == 0, arrayKey == array.length - 1);
                }
            }
        } else if (object_name) {
            iteratorFunction = function(context, callback) {
                var object = self.resolve(context, object_name);
                var i = 0;
                var prev;
                for (var objectKey in object) {
                    if (object.hasOwnProperty(objectKey)) {
                        if (i) {
                            callback(prev, object[prev], i == 1, false);
                        }
                        i++;
                        prev = objectKey;
                    }
                }
                if (prev) {
                    callback(prev, object[prev], i == 1, true);
                }
            }
        } else if (of_name) {
            iteratorFunction = function(context, callback) {
                var arrayKey = 0;
                var generator = self.resolve(context, of_name);
                for (arrayValue of generator) {
                    callback(arrayKey++, arrayValue, arrayKey == 0, false); // TODO: Detect last iteration over generator.
                }
            }
        } else {
            throw new Error('<loop> tag must contain "array", "object" or "of" attribute.');
        }

        var results = [];

        var savedKey = context.key;
        var savedValue = context.value;
        var savedFirst = context.first;
        var savedLast = context.last;

        iteratorFunction(context, function(contextKey, contextValue, contextFirst, contextLast) {
            context.key = contextKey;
            context.value = contextValue;
            context.first = contextFirst;
            context.last = contextLast;

            var result = this.renderChildren(context, element);
            Array.prototype.push.apply(results, result);
        }.bind(this));

        context.key = savedKey;
        context.value = savedValue;
        context.first = savedFirst;
        context.last = savedLast;

        return results;
    } else if (tagName == 'TRIM') {
        var prev = context._internal.trim;
        context._internal.trim = true;

        result = this.renderChildren(context, element);

        context._internal.trim = prev;

        return result;
    //} else if (tagName == 'RAW') {
        //return document.createTextNode(element.innerHTML);
    } else if (tagName == 'UNSAFE') {
        return document.createTextNode(element.innerHTML);
    } else if (tagName == '#text') {
        var content = element.textContent;

        if (context._internal.trim && content.trim().length == 0) {
            content = '';
        }

        return document.createTextNode(content);
    } else if (tagName == '#comment') {
        return document.createComment(element.textContent);
    } else {
        var renderedElement = element.cloneNode(false);

        this.renderChildren(context, element).forEach(function(node) {
            renderedElement.appendChild(node);
        });

        return renderedElement;
    }
};

window.Tempilze = window.Templize || Templise;
