'use strict';
const Promise = require('bluebird');
const ts = require('typescript');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const _ = require('lodash')

let once = true

function resolveDecorators(fileNames, options) {
  // Build a program using the set of root file names in fileNames
  let program = ts.createProgram(fileNames, options);

  // Get the checker, we will use it to find more about classes
  let checker = program.getTypeChecker();

  let decorators = [];

  // Visit every sourceFile in the program
  for (const sourceFile of program.getSourceFiles()) {
    // Walk the tree to search for classes
    ts.forEachChild(sourceFile, (node) => visit(node, sourceFile.fileName));
  }

  return decorators

  /** visit nodes finding exported classes */
  function visit(node, fileName) {
    if (node.kind === ts.SyntaxKind.ClassDeclaration) {
      // This is a top level class, get its symbol
      if (node.decorators) {
        decorators = [
          ...decorators,
          ...node.decorators.map(s => serializeDecorator(node, s, fileName))
        ]

      }
    } else if (node.kind === ts.SyntaxKind.ModuleDeclaration) {
      // This is a namespace, visit its children
      ts.forEachChild(node, (s) => visit(s, fileName));
    }
  }

  function serializeSymbol(symbol) {
    return {
      name: symbol.getName(),
      documentation: ts.displayPartsToString(symbol.getDocumentationComment()),
      type: checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration))
    };
  }

  /** Serialize a signature (call or construct) */
  function serializeSignature(signature) {
    return {
      parameters: signature.parameters.map(serializeSymbol),
      returnType: checker.typeToString(signature.getReturnType()),
      documentation: ts.displayPartsToString(signature.getDocumentationComment())
    };
  }

  function serialize(t) {
    let result
    if (t.kind === ts.SyntaxKind.NumericLiteral) {
      result = parseInt(t.text)
    } else if (t.kind === ts.SyntaxKind.ArrayLiteralExpression) {
      result = serializeArray(t);
    } else if (t.kind === ts.SyntaxKind.ObjectLiteralExpression) {
      result = serializeObject(t)
    } else if (t.kind === ts.SyntaxKind.PropertyAssignment) {
      ts.forEachChild(t, (v) => {
        result = serialize(v)
      })
    } else if (t.kind === ts.SyntaxKind.TrueKeyword) {
      result = true
    } else if (t.kind === ts.SyntaxKind.FalseKeyword) {
      result = false
    } else if (t.kind === ts.SyntaxKind.PropertyAccessExpression) {
      result = ``
      ts.forEachChild(t, (node) => {
        result = `${result}${result === '' ? '' : '.'}${node.escapedText}`
      })

    } else {
      if (t.text && t.text.indexOf('JSON') === 0) {
        result = JSON.parse(t.text.substr(4))
      } else {
        result = t.text
      }
    }
    return result
  }

  function serializeObject(node) {
    let res = {}
    ts.forEachChild(node, (t) => {
      res[t.name.escapedText] = serialize(t)
    })
    return res
  }

  function serializeArray(node) {
    let res = []
    ts.forEachChild(node, (t) => {
      res.push(serialize(t))
    })
    return res
  }

  function serializeDecorator(node, decorator, fileName) {
    let symbol = checker.getSymbolAtLocation(decorator.expression.getFirstToken());
    let decoratorType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
    let details = serializeSymbol(symbol);
    details.parameters = []
    details.constructors = decoratorType.getCallSignatures().map(serializeSignature);
    let parseParameters = (t) => {
      ts.forEachChild(t, (x) => {
        if (x.kind === ts.SyntaxKind.PropertyAssignment) {
          let result = {}
          result.name = x.name.text
          ts.forEachChild(x, (y) => {
            result.value = serialize(y)
          })
          if (result.value) {
            details.parameters.push(result)
          }
        }
      })
    }
    let foundParamter = false
    let findParamter = (t) => {
      if (t.kind === ts.SyntaxKind.CallExpression) {
        foundParamter = true
        ts.forEachChild(t, parseParameters)
      } else if (!foundParamter) {
        ts.forEachChild(t, findParamter)
      }
    }
    ts.forEachChild(node, findParamter)

    ts.forEachChild(node, (n) => {
      if (n.decorators) {
        details.childDecorators = [
          ...(details.childDecorators || []),
          ...n.decorators.map(s => serializeDecorator(n, s, fileName))
        ]
      }
    });

    details.fileName = fileName;
    return details;
  }
}

const ROOT_PATH = path.join(__dirname, '..', '..', 'src')

class ServerlessAnnotations {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;


    this.commands = {
      'collect': {
        usage: 'Collects all lambda entry modules',
        lifecycleEvents: [
          'init'
        ]
      }
    };

    this.hooks = {
      'before:package:initialize': () => this.collectFunctions(),
      'before:invoke:invoke': () => this.collectFunctions(),
      'before:invoke:local:invoke': () => this.collectFunctions(),
      'before:deploy:function:initialize': () => this.collectFunctions(),
      'before:aws:logs:logs': () => this.collectFunctions(),
      'collect:init': () => this.collectFunctions()
    };

  }

  collectHandlers() {
    let config = _.assign({}, {
      pattern: 'src/handlers/**/*.ts',
      ignore: ['src/shared'],
      handlers: {
        handler: {}
      }
    }, this.serverless.service.custom ? this.serverless.service.custom.annotations : undefined);

    const files = glob.sync(config.pattern, {
      ignore: config.ignore,
      // root: ROOT_PATH
    });

    let decorators = resolveDecorators(files, {
      target: ts.ScriptTarget.ES5,
      module: ts.ModuleKind.CommonJS
    });

    let handlers = decorators
      .filter(d => Object.keys(config.handlers).indexOf(d.name) >= 0)
      .map(d => ({
        name: d.name,
        options: _.mapValues(_.keyBy(d.parameters, 'name'), 'value'),
        fileName: d.fileName.replace(ROOT_PATH + '/', ''),
        handlers: d.childDecorators ? d.childDecorators.map(c => ({
          name: c.name,
          options: _.mapValues(_.keyBy(c.parameters, 'name'), 'value')
        })) : undefined
      }));
    return handlers
  }

  collectFunctions() {
    return new Promise((resolve, reject) => {

      let handlers = this.collectHandlers()

      const handlerConfig = _.extend({}, {
        handler: {}
      }, this.serverless.service.custom && this.serverless.service.custom.annotations ? this.serverless.service.custom.annotations.handlers : undefined);

      const eventConfig = _.extend({}, {
        events: {}
      }, this.serverless.service.custom && this.serverless.service.custom.annotations ? this.serverless.service.custom.annotations.events : undefined);

      this.serverless.service.functions = this.serverless.service.functions || {}
      let stage = this.serverless.service.provider.stage;
      if (this.serverless.variables.options.stage) {
        stage = this.serverless.variables.options.stage;
      }
      let handlerCount = 0
      for (let handler of handlers) {
        if (!handler.options) {
          throw new Error('Could not get handler options')
        }
        if (!handler.options.name) {
          throw new Error('Hanlder name has to be provided')
        }
        if (this.serverless.service.functions[handler.options.name]) {
          throw new Error(`Handler with name ${handler.options.name} already exists`)
        }
        let mergedEvents = []
        for (let e of (handler.options.events || [])) {
          let type = Object.keys(e)[0]
          mergedEvents.push(_.merge({}, e, eventConfig[type]))
        }
        let functionName = this.getFunctionName(stage, this.serverless.service.service, handler.options.name)
        this.serverless.service.functions[handler.options.name] = Object.assign({}, {
          handler: path.relative(process.cwd(), handler.fileName.replace(/.ts$/, '.default')),
          name: functionName,
          events: mergedEvents,
          timeout: handler.options.timeout,
          memory: handler.options.memory
        }, handlerConfig[handler.name])
        handlerCount++
        process.env.SLS_DEBUG && this.serverless.cli.log(`Added funtion: ${handler.options.name} as ${functionName}`);
      }
      // console.log(JSON.stringify(this.serverless.service.functions))
      this.serverless.cli.log(`Resolved to ${handlerCount} functions`)
      // console.log(JSON.stringify(this.serverless.service.functions))
      resolve()

      // reject()
    })
  }

  getFunctionName(stage, service, name) {
    return `${service}-${stage}-${name}`
  }




}

module.exports = ServerlessAnnotations;
