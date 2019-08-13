# tslintrules

This is a small set of custom tslint rules.

## bulkRenameRule.ts

This rule simplifies needing to do a bulk rename of symbols. For example the codelyzer rule 'component-class-suffix' identifies all components that do not end in 'Component', but cannot fix them. It is fairly easy to take the list of failures and convert them into a set of renames.
The rule can be configured like

> "bulk-rename" : [true, {
> "old" : "new"
>}]

When this is run with `--fix` all Typescript Identifiers will be renamed from old to new.

## enforceModuleStructureRule.ts
This rule enforces good module design, specifically with respect to Angular's `*.module.ts` files.  There are two aspects to the rule:

1. Files may not use relative path imports to import files above that module's *.module.ts file
2. When absolute path imports are used, the imported path must be a sibling of a *.module.ts file

Given the following structure

    ./foo/foo.module.ts
         /baz.ts
         /bar/bar.ts

    ./bip/bip.module.ts
         /bop/bop.ts

Rule #1 allows bar.ts to import `../baz.ts`, but not `../../bip/bip.module`
Rule #2 allows importing of `foo/baz.ts`, but disallows importing of `foo/bar/bar.ts` because there is no *.module.ts file in the `bar` directory.

### Nested modules
Nested modules, as below follow the same rules.

    ./foo/foo.module.ts
         /bar/bar.module.ts
             /baz.ts
            
baz will not be able to import anything higher than `./` - it is said to belong to the bar module.
`foo.module.ts` may import `./bar/baz.ts`, though this may be a sign of weak modules.  External clients may import `/foo/bar/baz.ts` because it is a sibling of a *.module.ts file, and considered public.