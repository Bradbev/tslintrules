import * as fs from 'fs';
import * as path from 'path';
import * as minimatch from 'minimatch';
import { DH_UNABLE_TO_CHECK_GENERATOR } from 'constants';

const findDirMemoize = {};

export function findModuleDir(dir: string): string {
  let d = findDirMemoize[dir];
  if (d) {
    return d;
  }
  d = findModuleDirImpl(dir);
  findDirMemoize[dir] = d;
  return d;
}

export function dirContainsModule(dir: string): boolean {
  try {
    const files = fs.readdirSync(dir);
    return !!files.find(f => f.endsWith('.module.ts'));
  } catch (_) {
    return false;
  }
}

export function getTsConfigDir(dir: string): any {
  return walkUpDirs(dir, (_, files) => {
    return !!files.find(f => f === 'tsconfig.json');
  });
}

export class TsConfig {
  private baseUrl;
  private pathKeys: string[] = [];
  private paths = {};
  constructor(conf, dir: string) {
    const u = conf.compilerOptions.baseUrl;
    // it's way easier to work with an absolute URL for baseUrl
    this.baseUrl = path.join(dir, u);

    Object.keys(conf.compilerOptions.paths).forEach(key => {
      const value = conf.compilerOptions.paths[key];
      // transform the key from 'app/*' to 'app/'
      const shortKey = key.replace('*', '');
      this.paths[shortKey] = value.map(v => {
        // trim off the key at the end, so path joining is all that
        // is needed later
        v = v.substring(0, v.length - key.length);
        return path.join(this.baseUrl, v);
      });
      this.pathKeys.push(shortKey);
    });
    // sort longest keys first
    this.pathKeys.sort((a, b) => b.length - a.length);
  }

  public resolveImportToFullPath(p: string): string {
    for (var key of this.pathKeys) {
      if (p.startsWith(key)) {
        for (var pathToCheck of this.paths[key]) {
          const toCheck = path.join(pathToCheck, p + '.ts');
          if (fileExists(toCheck)) {
            return toCheck;
          }
        }
      }
    }
    return '';
  }
}

let tsConfig: TsConfig = null;
export function findTsConfig(dir: string): TsConfig {
  if (tsConfig) {
    return tsConfig;
  }
  const confDir = getTsConfigDir(dir);
  const data = fs.readFileSync(path.join(confDir, 'tsconfig.json'));
  tsConfig = new TsConfig(JSON.parse(data.toString()), confDir);
  return tsConfig;
}

export function fileExists(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
}

function findModuleDirImpl(dir: string): string {
  try {
    if (path.dirname(dir) === dir) {
      return '';
    }
    const files = fs.readdirSync(dir);
    const modules = files.find(f => f.endsWith('.module.ts'));
    if (modules) {
      return dir;
    }
    if (files.find(f => f === 'angular.json')) {
      return '';
    } else {
      return findModuleDir(path.dirname(dir));
    }
  } catch (_) {
    return '';
  }
}

function walkUpDirs(
  dir: string,
  predicate: (dir: string, files: string[]) => boolean
): string {
  try {
    if (path.dirname(dir) === dir) {
      return '';
    }
    const files = fs.readdirSync(dir);
    if (predicate(dir, files)) {
      return dir;
    }
    return walkUpDirs(path.dirname(dir), predicate);
  } catch (_) {
    return '';
  }
}
