/*
 * enforceModuleStructureRule enforces the following structure.
 * ./foo/foo.module.ts
 * ./foo/bar.component.ts
 * ./foo/baz/baz.service.ts
 * In the above structure, files under ./foo must only use relative paths to other files
 * at or under ./foo.  Importing of global packages is fine.
 *
 *  Algorithm:
 *  Only run the rule if import text starts with "."
 *  Walk upward until *.module.ts or angular.json is found
 *  - *.module.ts defines the upper depth that may prefix an import
 *  - angular.json means an error happened
 * 
 * The second half of enforceModuleStructureRule relates to external imports and 
 * requires all non-relative imports to reference files that are siblings of a *.module.ts file.
 * eg, given the following structure
 * ./foo/foo.module.ts
 * ./foo/bar.component.ts
 * ./foo/baz/baz.service.ts
 * it is permitted to 
 import { FooModule } from 'foo/foo.module'
 import { BarComponent } from 'foo/bar.component'
 * But it will not be permitted to import baz, ieg
 import { BazService } from 'foo/baz/baz.service' // error
 * This rule prevents clients from importing private files from a module
*/

import {
  IRuleMetadata,
  Replacement,
  RuleFailure,
  WalkContext
} from 'tslint/lib';
import {
  forEachChild,
  isNamedImports,
  NamedImports,
  Node,
  SourceFile,
  isImportDeclaration,
  ImportDeclaration,
  isStringLiteral
} from 'typescript/lib/typescript';
import { AbstractRule } from 'tslint/lib/rules';
import {
  findModuleDir,
  dirContainsModule,
  getTsConfigDir,
  findTsConfig
} from './util';
import * as path from 'path';

export class Rule extends AbstractRule {
  static readonly metadata: IRuleMetadata = {
    description: 'Enforces that modules only import within their own module',
    hasFix: false,
    options: null,
    optionsDescription: 'Not configurable.',
    ruleName: 'enforce-module-structure',
    type: 'maintainability',
    typescriptOnly: true
  };

  apply(sourceFile: SourceFile): RuleFailure[] {
    return this.applyWithFunction(sourceFile, walk);
  }
}

function isRelativePath(p: string): boolean {
  return p.startsWith('.');
}

function isEnforcedPath(p: string): boolean {
  if (p.startsWith('app')) {
    return true;
  }
  return false;
}

function validateNamedImports(
  context: WalkContext,
  node: ImportDeclaration
): void {
  console.log(node.getText());
  const dir = path.dirname(context.sourceFile.fileName);
  const moduleDir = findModuleDir(dir);
  node.forEachChild(n => {
    if (isStringLiteral(n)) {
      if (isRelativePath(n.text)) {
        const importDir = path.dirname(path.join(dir, n.text));
        if (importDir != moduleDir) {
          context.addFailureAtNode(
            node,
            `Not allowed to relative import outside parent module (located at ${moduleDir}).  Provide an import path that does not start with '.'`
          );
        }
      }
      console.log(n.text, moduleDir);
      if (isEnforcedPath(n.text)) {
        const realFile = findTsConfig(dir).resolveImportToFullPath(n.text);
        console.log('ts', realFile);
        if (!dirContainsModule(path.dirname(realFile))) {
          context.addFailureAtNode(
            node,
            `Not allowed to import from levels that do not contain a module (located at ${
              n.text
            }) - they are considered private.  Export from higher levels.`
          );
        }
      }
    }
  });
}

function walk(context: WalkContext): void {
  const { sourceFile } = context;
  const callback = (node: Node): void => {
    console.log(node.getText());
    if (isImportDeclaration(node)) {
      validateNamedImports(context, node);
    }

    return forEachChild(node, callback);
  };

  return forEachChild(sourceFile, callback);
}
