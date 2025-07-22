import { knownBuiltIns } from '../knownBuiltIns.js';
import { builtinModules as nodeCoreModules } from 'module';

export default function ({ types: t }) {
  return {
    pre(file) {
      file.metadata.globalIdentifiersAccesses = new Set();
      file.metadata.nodeCoreModulesAccesses = new Set();
    },
    visitor: {
      Identifier(path, state) {
        
        const name = path.node.name;
        
        // If the identifier is part of an ImportDeclaration (e.g., import { StorageClient ... } from '...'),
        // it's not a global access. Skip it.
        if (
          t.isImportSpecifier(path.parent) || // e.g., 'StorageClient' in { StorageClient }
          t.isImportDefaultSpecifier(path.parent) || // e.g., 'React' in import React from 'react'
          t.isImportNamespaceSpecifier(path.parent) // e.g., '*' in import * as something from '...'
        ) {
          return;
        }

        // If this identifier is the 'property' part of a MemberExpression (e.g., `obj.prop`),
        // then the MemberExpression visitor will handle it. We skip it here.
        if (t.isMemberExpression(path.parent) && path.parent.property === path.node) {
          return;
        }

        // If the identifier is part of an ExportSpecifier (e.g., 'default' in export { default ... }),
        // it's not a global access. Skip it.
        if (t.isExportSpecifier(path.parent)) {
          return;
        }

        // If the identifier is the 'key' of a ClassMethod (e.g., 'constructor' in class { constructor() {} }),
        // or a property of a ClassProperty (e.g., 'myProp' in class { myProp = 1 }),
        // it's not a global access. Skip it.
        // This is a workaround to prevent 'constructor', 'myProp', etc. from being caught as direct globals.
        if (
          (t.isClassMethod(path.parent) || t.isClassProperty(path.parent)) &&
          path.parent.key === path.node
        ) {
          return;
        }

        // If the identifier is the 'key' of an ObjectProperty (e.g., `db` in { db: value }),
        // it's not a global access. Skip it.
        if (t.isObjectProperty(path.parent) && path.parent.key === path.node) {
          return;
        }

        // If the identifier is the 'object' part of a MemberExpression (e.g., `navigator` in `navigator.product`),
        // and you ONLY care about top-level calls/accesses, then skip it here.
        // The *access* is to the property (`.product`), not the object itself as a top-level global.
        if (t.isMemberExpression(path.parent) && path.parent.object === path.node) {
          return;
        }

        // If the identifier is the argument of a 'typeof' UnaryExpression, skip it.
        // This is a common pattern for environment checks and doesn't imply direct API usage.
        if (t.isUnaryExpression(path.parent) && path.parent.operator === 'typeof' && path.parent.argument === path.node) {
          return;
        }

        // If the identifier is the right-hand side of an 'instanceof' BinaryExpression, skip it.
        // This is a common pattern for type checking.
        if (t.isBinaryExpression(path.parent) && path.parent.operator === 'instanceof' && path.parent.right === path.node) {
          return;
        }

        if (path.scope.hasBinding(name)) {
          return;
        }

        if (knownBuiltIns.has(name)) {
          return;
        }

        state.file.metadata.globalIdentifiersAccesses.add(name);
      },

      MemberExpression(path, state) {
        const object = path.node.object;
        const property = path.node.property;

        if (!t.isIdentifier(object)) {
          return;
        }

        const objectName = object.name;
        const call = `${objectName}.${property.name}`;

        if (knownBuiltIns.has(call)) {
          return;
        }

        if (state.file.metadata.nodeCoreModulesAccesses.has(objectName)) {
          state.file.metadata.nodeCoreModulesAccesses.add(call);
        } else {
          if (path.scope.hasBinding(objectName)) {
            return;
          }

          if (knownBuiltIns.has(objectName)) {
            return;
          }

          state.file.metadata.globalIdentifiersAccesses.add(call);
        }
      },

      CallExpression(path, state) {
        const callee = path.node.callee;
        const args = path.node.arguments;

        if (
          t.isIdentifier(callee) &&
          callee.name === 'require' &&
          args.length === 1 &&
          t.isStringLiteral(args[0])
        ) {
          const modulePath = args[0].value;

          if (!nodeCoreModules.includes(modulePath)) {
            return;
          }

          state.file.metadata.nodeCoreModulesAccesses.add(`${modulePath}`);
        }
      },
    },
  };
};