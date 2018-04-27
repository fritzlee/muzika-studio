#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs";
import chalk from "chalk";
import { join, dirname, parse, relative } from "path";
import { pathExistsSync } from "fs-extra";
import * as glob from "glob";
import * as prettier from "prettier";

import { generateSource } from "./generateSource";
import { parseArgs } from "./parseArgs";
import { copyRuntime } from "./copyRuntime";
import { extractAbi } from "./abiParser";
import {getVersion} from './utils';

const { blue, red, green, yellow } = chalk;
const cwd = process.cwd();

async function main() {
  const options = parseArgs();

  const matches = glob.sync(options.glob, { ignore: "node_modules/**", absolute: true });

  if (matches.length === 0) {
    // tslint:disable-next-line
    console.log(red(`Found ${matches.length} ABIs.`));
    process.exit(0);
  }

  // tslint:disable-next-line
  console.log(green(`Found ${matches.length} ABIs.`));

  const prettierConfig = await prettier.resolveConfig(dirname(matches[0]));
  if (prettierConfig) {
    // tslint:disable-next-line
    console.log("Found prettier config file");
  }

  // tslint:disable-next-line
  console.log("Generating typings...");

  // copy runtime in directory of first typing (@todo it should be customizable)
  const runtimeFilename = "typechain-runtime.ts";
  const runtimePath = join(options.outDir || dirname(matches[0]), runtimeFilename);
  const indexPath = join(options.outDir || dirname(matches[0]), 'index.ts');
  copyRuntime(runtimePath);
  // tslint:disable-next-line
  console.log(blue(`${runtimeFilename} => ${runtimePath}`));

  // generate wrappers
  let importString = [];
  let contractNames = [];
  matches.forEach(p => {
    let contractName = processFile(
      p,
      options.force,
      runtimePath,
      {...(prettierConfig || {}), parser: "typescript", singleQuote: true},
      options.outDir,
    );

    if (contractName) {
      contractNames.push(contractName);
      importString.push(`import { I${contractName}, Truffle${contractName} } from './interface/${contractName}';`);
    }

  });

  // @TODO dynamic path resolve
  const indexFileContent = `/* GENERATED BY TYPECHAIN VER. ${getVersion()} */
/* tslint:disable */
import { InjectionToken, Provider } from '@angular/core';
import { WEB3 } from '../app/web3.provider';
import { TruffleContract } from './typechain-runtime';

${importString.join('\n')}

let ProviderFactory = (contract: TruffleContract<any>) => {
  return (web3: any) => {
    contract.setProvider(web3.currentProvider);
    return contract;
  };
};

${contractNames.map(name => `export const ${name} = new InjectionToken<TruffleContract<I${name}>>('${name}')`).join(';\n')};

export const ContractProviders: Provider[] = [
${contractNames.map(name => `  { provide: ${name}, useFactory: ProviderFactory(Truffle${name}), deps: [WEB3] }`).join(',\n')}
];
`;

  writeFileSync(indexPath, indexFileContent);
}

function processFile(
  absPath: string,
  forceOverwrite: boolean,
  runtimeAbsPath: string,
  prettierConfig: prettier.Options,
  fixedOutputDir?: string,
): string {
  const relativeInputPath = relative(cwd, absPath);
  const parsedInputPath = parse(absPath);
  const filenameWithoutAnyExtensions = getFilenameWithoutAnyExtensions(parsedInputPath.name);
  const outputDir = fixedOutputDir || parsedInputPath.dir;
  const outputDirInterface = join(outputDir, 'interface');
  const outputPath = join(outputDirInterface, filenameWithoutAnyExtensions + ".ts");
  const relativeOutputPath = relative(cwd, outputPath);

  const runtimeRelativePath = getRelativeModulePath(outputDirInterface, runtimeAbsPath);
  // tslint:disable-next-line
  console.log(blue(`${relativeInputPath} => ${relativeOutputPath}`));
  if (pathExistsSync(outputPath) && !forceOverwrite) {
    // tslint:disable-next-line
    console.log(red("File exists, skipping"));
    return;
  }

  const abiString = readFileSync(absPath).toString();
  const rawAbi = extractAbi(abiString);

  if (rawAbi.length === 0) {
    // tslint:disable-next-line
    console.log(yellow("ABI is empty, skipping"));
    return;
  }

  const typescriptSourceFile = generateSource(rawAbi, {
    fileName: filenameWithoutAnyExtensions,
    relativeRuntimePath: runtimeRelativePath,
    relativeInputPath: getRelativePathOfABI(outputDirInterface, relativeInputPath)
  });
  writeFileSync(outputPath, prettier.format(typescriptSourceFile, prettierConfig));

  return filenameWithoutAnyExtensions;
}

function getFilenameWithoutAnyExtensions(filePath: string): string {
  const endPosition = filePath.indexOf(".");
  return filePath.slice(0, endPosition !== -1 ? endPosition : filePath.length);
}

function getRelativeModulePath(from: string, to: string): string {
  return relative(from, to).replace(".ts", "").replace(/\\/g, '/'); // @note: this is probably not the best way to find relative path for modules
}

function getRelativePathOfABI(outDir: string, abiPath: string): string {
  return relative(outDir, abiPath).replace(/\\/g, '/');
}

main().catch(e => {
  // tslint:disable-next-line
  console.error(red("Error occured: ", e.message));
  process.exit(1);
});