/*
 * This rule bulk renames from one symbol to another
 */
import {
  IRuleMetadata,
  RuleFailure,
  WalkContext,
  IOptions,
  Replacement
} from 'tslint/lib';
import {
  forEachChild,
  Node,
  SourceFile,
  isIdentifier,
  Identifier
} from 'typescript/lib/typescript';
import { AbstractRule } from 'tslint/lib/rules';

export class Rule extends AbstractRule {
  static readonly metadata: IRuleMetadata = {
    description: 'Enforces that modules only import within their own module',
    hasFix: true,
    options: 'array',
    optionsDescription: 'Not configurable.',
    ruleName: 'bulk-rename',
    type: 'maintainability',
    typescriptOnly: true
  };

  apply(sourceFile: SourceFile): RuleFailure[] {
    const { ruleArguments } = this.getOptions();
    return this.applyWithFunction(sourceFile, walk, ruleArguments[0]);
  }
}

function renameIdentifier(
  context: WalkContext,
  node: Identifier,
  replacements: any
): void {
  if (replacements.hasOwnProperty(node.text)) {
    const fix = new Replacement(
      node.getStart(),
      node.getWidth(),
      replacements[node.text]
    );
    context.addFailureAtNode(
      node,
      `Replace with ${replacements[node.text]}`,
      fix
    );
  }
}

function walk(context: WalkContext): void {
  const { sourceFile, options } = context;
  const callback = (node: Node): void => {
    if (isIdentifier(node)) {
      renameIdentifier(context, node, options);
    }

    return forEachChild(node, callback);
  };

  return forEachChild(sourceFile, callback);
}
