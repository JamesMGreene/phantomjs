/*jslint sloppy: true, nomen: true */
/*global exports:true */

/*
  This file is part of the PhantomJS project from Ofi Labs.

  Copyright (C) 2012 James M. Greene <james.m.greene@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the <organization> nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

exports = QtUtils;

/**
 * For internal use within QtUtils only.
 * @private
 * @constructor
 */
function Handler(callback, connector) {
    if (!this instanceof Handler) {
        return new Handler(callback, connector);
    }
    
    if (typeof callback !== 'function') {
        throw new TypeError('ArgumentException: `callback` must be a Function');
    }
    else if (connector != null && typeof connector !== 'function') {
        throw new TypeError('ArgumentException: `connector` is optional but must be a Function if provided');
    }

    this.callback = callback;
    this.connector = connector || callback;
}
/**
 * For internal use within QtUtils only.
 * @static
 */
Handler.isValid = function Handler$isValid(handler) {
    return (!!handler &&
            handler instanceof Handler &&
            typeof handler.callback === 'function' &&
            typeof handler.connector === 'function');
};

/**
 * 
 */
function defineSignalConnectionProperty(receiver, signal, handlerName, store, handlerWrapperFn) {
    Object.defineProperty(receiver, handlerName, {
        // `this` === `receiver`

        /**
         * Create a setter property to configure a handler for the signal.
         * @name `handlerName`
         * @memberOf `receiver`
         */
        set: function(fn) {
            var handlerObj = store[handlerName];
                
            // Disconnect previous handler (if any)
            if (Handler.isValid(handlerObj)) {
                try {
                    signal.disconnect(handlerObj.connector);
                } catch (e) {}
            }

            // Delete the previous handler
            delete store[handlerName];

            // Connect the new handler iff it's a function
            if (typeof fn === 'function') {
                // Store the new handler for reference
                store[handlerName] = handlerWrapperFn(fn);
                signal.connect(store[handlerName].connector);
            }
        },

        /**
         *
         */
        get: function() {
            return Handler.isValid(store[handlerName]) ? store[handlerName].callback : undefined;
        }
    });
}

var QtUtils = {

    /**
     * 
     */
    defineSignalHandler: function(listener, handlerName, signalName, store, emitter) {
        // Argument validation
        if (!listener) {
            throw new TypeError('ArgumentException: `listener`');
        }
        else if (!handlerName) {
            throw new TypeError('ArgumentException: `handlerName`');
        }
        else if (!signalName) {
            throw new TypeError('ArgumentException: `signalName`');
        }
        else if (!store) {
            throw new TypeError('ArgumentException: `store`');
        }
        else if (store instanceof Array) {
            throw new TypeError('ArgumentException: `store` must be a Map-like object but you provided an Array');
        }
        else if (typeof store !== 'object') {
            throw new TypeError('ArgumentException: `store` must be a Map-like object but you provided a(n) "' + (typeof store) + '" type');
        }

        // If no `emitter` was provided, default it to the `listener` arg
        if (!emitter) {
            emitter = listener;
        }
        
        var signal = emitter[signalName];
        
        var handlerWrapperFn = function(fn) {
            return new Handler(fn);
        };
        
        defineSignalConnectionProperty(listener, signal, handlerName, store, handlerWrapperFn);
    },

    /**
     * 
     */
    defineCallbackHandler: function(listener, handlerName, callbackName, store, emitter) {
        // Argument validation
        if (!listener) {
            throw new TypeError('ArgumentException: `listener`');
        }
        else if (!handlerName) {
            throw new TypeError('ArgumentException: `handlerName`');
        }
        else if (!signalName) {
            throw new TypeError('ArgumentException: `callbackName`');
        }
        else if (!store) {
            throw new TypeError('ArgumentException: `store`');
        }
        else if (store instanceof Array) {
            throw new TypeError('ArgumentException: `store` must be a Map-like object but you provided an Array');
        }
        else if (typeof store !== 'object') {
            throw new TypeError('ArgumentException: `store` must be a Map-like object but you provided a(n) "' + (typeof store) + '" type');
        }

        // If no `emitter` was provided, default it to the `listener` arg
        if (!emitter) {
            emitter = listener;
        }
        
        var callbackObj = emitter[callbackName](),
            signal = callbackObj.called;
            
        var handlerWrapperFn = function(fn) {
            var connector = function() {
                // Callback will receive a "deserialized", normal `arguments` array
                callbackObj.returnValue = fn.apply(this, arguments[0]);
            };
            return new Handler(fn, connector);
        }; 
        
        defineSignalConnectionProperty(listener, signal, handlerName, store, handlerWrapperFn);
    },

    /**
     * 
     */
    defineErrorSignalHandler: function(listener, handlerName, signalName, store, emitter) {
        // Argument validation
        if (!listener) {
            throw new TypeError('ArgumentException: `listener`');
        }
        else if (!handlerName) {
            throw new TypeError('ArgumentException: `handlerName`');
        }
        else if (!signalName) {
            throw new TypeError('ArgumentException: `signalName`');
        }
        else if (!store) {
            throw new TypeError('ArgumentException: `store`');
        }
        else if (store instanceof Array) {
            throw new TypeError('ArgumentException: `store` must be a Map-like object but you provided an Array');
        }
        else if (typeof store !== 'object') {
            throw new TypeError('ArgumentException: `store` must be a Map-like object but you provided a(n) "' + (typeof store) + '" type');
        }

        // If no `emitter` was provided, default it to the `listener` arg
        if (!emitter) {
            emitter = listener;
        }
        
        var signal = emitter[signalName];
        
        var handlerWrapperFn = function(fn) {
            var connector = function(message, stack) {
                var revisedStack = JSON.parse(stack).map(function(item) {
                    return { 'file': item.url, 'line': item.lineNumber, 'function': item.functionName }
                });
                fn(message, revisedStack);
            };
            return new Handler(fn, connector);
        };
        
        defineSignalConnectionProperty(listener, signal, handlerName, store, handlerWrapperFn);
    }

};
