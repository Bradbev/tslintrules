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
 */

/* 
* enforceModuleImportsRule is a rule that requires all non-relative imports to reference
* files that are siblings of a *.module.ts file.
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

function isRelativePath(path: string): boolean {
  return path.startsWith('.');
}

const seenPaths = {};

function findModuleForFile(fileName: string): string {
  console.log(fileName.split('/'));
  return '';
}

function validateNamedImports(
  context: WalkContext,
  node: ImportDeclaration
): void {
  const nodeText = node.getText();
  console.log(context.sourceFile.fileName);
  node.forEachChild(n => {
    if (isStringLiteral(n) && isRelativePath(n.text)) {
      console.log(n.text);
    }
  });

  // if (isBlankOrMultilineImport(nodeText)) return;

  // const leadingSpacesMatches = nodeText.match(LEADING_SPACES_PATTERN);
  // const trailingSpacesMatches = nodeText.match(TRAILING_SPACES_PATTERN);
  // const totalLeadingSpaces = leadingSpacesMatches ? leadingSpacesMatches[1].length : 1;
  // const totalTrailingSpaces = trailingSpacesMatches ? trailingSpacesMatches[1].length : 1;

  // if (totalLeadingSpaces === 1 && totalTrailingSpaces === 1) return;

  // const replacements = getReplacements(node, totalLeadingSpaces, totalTrailingSpaces);

  // context.addFailureAtNode(node, 'ha');
}

function walk(context: WalkContext): void {
  const { sourceFile } = context;
  const callback = (node: Node): void => {
    if (isImportDeclaration(node)) {
      validateNamedImports(context, node);
    }

    return forEachChild(node, callback);
  };

  return forEachChild(sourceFile, callback);
}
