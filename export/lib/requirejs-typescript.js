/**
 * This script was taken from the following location:
 * https://github.com/mattslocum/requirejs-typescript/blob/master/src/requirejs-typescript.js
 */
define(['typescript'],
function (typescript) {
  var fetchText,
    fs,
    buildMap = {};

  if (typeof window !== "undefined" && window.navigator && window.document) {
    fetchText = function (url, callback, errback, headers) {
      var header,
        xhr = new XMLHttpRequest();

      xhr.open('GET', url, true);

      //Allow plugins direct access to xhr headers
      if (headers) {
        for (header in headers) {
          if (headers.hasOwnProperty(header)) {
            xhr.setRequestHeader(header.toLowerCase(), headers[header]);
          }
        }
      }

      xhr.onreadystatechange = function (evt) {
        var status, err;
        //Do not explicitly handle errors, those should be
        //visible via console output in the browser.
        if (xhr.readyState === 4) {
          status = xhr.status || 0;
          if (status > 399 && status < 600) {
            //An http 4xx or 5xx error. Signal an error.
            err = new Error(url + ' HTTP status: ' + status);
            err.xhr = xhr;
            if (errback) {
              errback(err);
            }
          } else {
            callback(xhr.responseText);
          }
        }
      };

      xhr.send(null);
    };
  } else if (typeof process !== "undefined" &&
    process.versions &&
    !!process.versions.node) {
    //Using special require.nodeRequire, something added by r.js.
    fs = require.nodeRequire('fs');
    fetchText = function (path, callback, errback) {
      try {
        var file = fs.readFileSync(url, 'utf8');
        //Remove BOM (Byte Mark Order) from utf8 files if it is there.
        if (file[0] === '\uFEFF') {
          file = file.substring(1);
        }
        callback(file);
      } catch (e) {
        if (errback) {
          errback(e);
        }
      }
    };
  }

  return {
    load: function (name, req, onLoad, config) {
      fetchText(req.toUrl(name) + '.ts', function (text) {
        var es3 = ts.transpileModule(text, {
          compilerOptions: {
            //declaration: false,
            sourceMap: true,
            sourceRoot: name.substring(0, name.lastIndexOf('/')),
            inlineSourceMap: true,
            inlineSources: true,
            target: "es5",
            module: "amd",
            declaration: false,
            noImplicitAny: false,
            removeComments: true,
            emitDecoratorMetadata: true,
            experimentalDecorators: true,
            allowJs: true,
            moduleResolution: "node",
            lib: ["es2017", "dom"]                        
          },
          fileName: name,
          moduleName: name
        }).outputText;

        // TODO: Handle compile errors

        if (config.isBuild) {
          buildMap[name] = es3;
        }

        onLoad.fromText(es3);
      }, function (err) {
        if (onLoad.error) {
          onLoad.error(err);
        }
      });
    },

    write: function (pluginName, moduleName, write) {
      if (buildMap.hasOwnProperty(pluginName)) {
        write.asModule(pluginName + '!' + moduleName, buildMap[moduleName]);
      }
    }
  }
}
);