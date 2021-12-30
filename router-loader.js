// const loaderUtils = require('loader-utils');
// import validateOptions from 'schema-utils';
const fs = require('fs');
const pathHandler = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse');
const t = require('@babel/types');
const generator = require('@babel/generator');

var readdir = promisify(fs.readdir);
var stat = promisify(fs.stat);
var readFile = promisify(fs.readFile);

const TAG = '__AUTO_ROUTE';

// console.log('-------loaderUtils------', loaderUtils);
/**
 * 验证入参
 */
const schema = {
  type: 'object',
  properties: {
    test: {
      type: 'string',
    },
  },
};

/**
 * 普通函数转 promise
 * @param {*} function 
 * @returns function after promisify
 */
function promisify(fn) {
  return function () {
    var args = arguments;
    return new Promise(function (resolve, reject) {
      [].push.call(args, function (err, result) {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve(result);
        }
      });
      fn.apply(null, args);
    });
  };
}

/**
 * 获取组件名
 * @param {*} path 
 * @returns component name
 */
function getComponentName(name) {
  let cname = name;
  if (cname.split('-').length > 0) {
    cname = cname
      .split('-')
      .map((item) => `${item.slice(0, 1).toUpperCase()}${item.substring(1)}`)
      .join('');
  } else {
    cname = `${cname.slice(0, 1).toUpperCase()}${cname.substring(1)}`;
  }
  return cname;
}

/**
 * 提取出要生成路由的文件信息
 * @param {*} source 
 * @returns 
 */
const handleDir = (entry, suffix, routeArr) => {
  return readdir(entry).then((files) => {
    files = files.map((item) => {
      let fullPath = `${entry}/${item}`;
      return stat(fullPath).then((stats) => {
        if (stats.isDirectory()) {
          return handleDir(fullPath, suffix, routeArr);
        } else {
          const fileObj = pathHandler.parse(fullPath);
          if (suffix.test(fileObj.ext)) {
            // 读取入口文件
            return readFile(fullPath, 'utf-8').then((data) => {
              // 使用babel parser解析AST
              const ast = parser.parse(data, {
                sourceType: 'module',
                plugins: ['jsx', 'flow'],
              });
              traverse.default(ast, {
                ExportNamedDeclaration: function (path) {
                  if (
                    path.node.declaration.declarations[0].id.name === TAG &&
                    path.node.declaration.declarations[0].init.value === true
                  ) {
                    const names = pathHandler.dirname(fullPath).split('/');
                    componentName = getComponentName(names[names.length - 1]);
                    routeArr.push({
                      path: fullPath,
                      component: componentName,
                    });
                  }
                },
              });
            });
          }
        }
      });
    });
    return Promise.all(files);
  });
};

/**
 * 生成目标路由
 * @param {*} source 
 * @returns 
 */
const generateRoute = (routArr, routeTag) => {
  const routes = [];
  routArr.map((item) => {
    const attributes = [];
    attributes.push(
      t.jsxAttribute(t.jsxIdentifier('path'), t.StringLiteral(item.routePath)),
      t.jsxAttribute(
        t.jsxIdentifier('element'),
        t.jsxExpressionContainer(
          t.jsxElement(
            t.jsxOpeningElement(t.jsxIdentifier(item.component), [], true),
            null,
            []
          )
        )
      )
    );
    const openingEle = t.jsxOpeningElement(
      t.jsxIdentifier(routeTag),
      attributes,
      true
    );
    routes.push(t.jsxElement(openingEle, null, []), t.jsxText('\n'));
  });
  return routes;
};


function loader(source) {
  const options = this.getOptions();
  // validateOptions(schema, options, 'Example Loader');
  const { entry, suffix } = options;
  let routeArr = [];
  let routeTag = 'Route';
  let isRouteDomImport = false;
  let output = this.resourcePath;
  console.log('output', output);
  handleDir(entry, suffix, routeArr).then(() => {
    routeArr = routeArr.map((item) => {
      return {
        component: item.component,
        path: pathHandler.relative(
          pathHandler.dirname(output), // 这里直接用 output 总会多取一级
          item.path
        ),
        routePath: pathHandler.dirname(pathHandler.relative(entry, item.path)),
      };
    });

    const ast = parser.parse(source, {
      sourceType: 'module',
      plugins: ['jsx', 'flow'],
    });
    traverse.default(ast, {
      Program(path) {
        path.traverse({
          ImportDeclaration(curPath) {
            const importPath = curPath.get('source').node.value;
            // 判断是否有引入 Route
            if (importPath === 'react-router-dom') {
              const specifiers = curPath.get('specifiers');
              specifiers.forEach((specifier) => {
                if (specifier.node.imported.name === 'Route') {
                  isRouteDomImport = true;
                  routeTag = specifier.node.local.name;
                  console.log('has import Route');
                  // break;
                }
              });
            }
            // 筛选是否有重复引入
            routeArr.forEach((item) => {
              if (item.path === importPath) {
                const specifiers = curPath.get('specifiers');
                specifiers.forEach((specifier) => {
                  if (
                    specifier.isImportDefaultSpecifier() ||
                    specifier.isImportSpecifier()
                  ) {
                    if (specifier.node.local.name === item.component) {
                      item.exist = true;
                    }
                  }
                });
              }
            });
          },
        });
        // 引入 Route
        if (!isRouteDomImport) {
          console.log('start to import Route');
          const routeImportDeclaration = t.importDeclaration(
            [t.importSpecifier(t.identifier('Route'), t.identifier('Route'))],
            t.stringLiteral('react-router-dom')
          );
          path.unshiftContainer('body', routeImportDeclaration);
        }
        // import 路由组件
        routeArr.forEach((item) => {
          if (!item.exist) {
            const importDefaultSpecifier = [
              t.importDefaultSpecifier(t.Identifier(item.component)),
            ];
            const importDeclaration = t.importDeclaration(
              importDefaultSpecifier,
              t.StringLiteral(item.path)
            );
            path.unshiftContainer('body', importDeclaration);
          }
        });
      },
      JSXText(path) {
        if (path.node.value.indexOf(TAG) != -1) {
          const routes = generateRoute(routeArr, routeTag);
          path.replaceWithMultiple([t.jsxText('\n'), ...routes]);
        }
      },
    });
    const newSource = generator.default(ast);
    console.log('111111', source)
    // console.log('222222', ast.program.body);
    return `${JSON.stringify(newSource.code)}`;
  });
}

module.exports = loader
