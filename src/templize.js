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

Templize.prototype.render = function(context, element) {
    if (!element) {
        var doc = document.createElement('div');

        doc.innerHTML = this.source.replace(/%([a-zA-Z0-9_-]+)%/g, function (all, name) {
            return context[name];
        });

        return this.render(context, doc);
    }

    var tagName = element.nodeName;
    if (tagName == 'T') {
        tagName = element.id.toUpperCase();
    }

    if (tagName == 'ECHO') {
        //var varKey = element.attributes[0].name;
        var varKey = element.textContent.trim();
        return document.createTextNode(context[varKey]);
    } else if (tagName == 'IF') {
        var trueKey = element.getAttribute('true');
        var falseKey = element.getAttribute('false');

        if ((trueKey && context[trueKey]) || (falseKey && !context[falseKey])) {
            return this.renderChildren(context, element);
        } else {
            return [];
        }
    } else if (tagName == 'LOOP') {
        var array_name = element.getAttribute('array');
        var object_name = element.getAttribute('object');

        var iteratorFunction;

        if (array_name) {
            iteratorFunction = function(context, callback) {
                var array = context[array_name];
                for (var arrayKey = 0; arrayKey < array.length; arrayKey++) {
                    var arrayValue = array[arrayKey];
                    callback(arrayKey, arrayValue, arrayKey == 0, arrayKey == array.length - 1);
                }
            }
        } else if (object_name) {
            iteratorFunction = function(context, callback) {
                var object = context[object_name];
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
        } else {
            throw new Error('<loop> tag must contain "array" or "object" attribute.');
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
    } else if (tagName == '#text') {
        return document.createTextNode(element.textContent);
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
