#!/usr/bin/env node

import { program } from 'commander'
import path from 'path'
import dotenv from 'dotenv'
import fs from 'fs/promises'
import { runCodeLoom } from '../lib/index.mjs'
import chalk from 'chalk'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

async function ensureOutputFolder(outputDir) {
  try {
    await fs.access(outputDir)
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(chalk.yellow(`Creating output directory: ${outputDir}`))
      await fs.mkdir(outputDir, { recursive: true })
    } else {
      throw error
    }
  }
  return outputDir
}

function printHeader() {
  console.log(chalk.bold.cyan('\n╔═══════════════════════════════════════╗'))
  console.log(chalk.bold.cyan('║           CodeLoom v1.0.0             ║'))
  console.log(chalk.bold.cyan('║  AI-powered Code Analysis & Optimizer ║'))
  console.log(chalk.bold.cyan('╚═══════════════════════════════════════╝\n'))
}

program
  .version('1.0.0')
  .description('AI-powered code analysis and optimization tool')
  .argument('<directories...>', 'Directories to analyze')
  .option(
    '-m, --max-critical-files <number>',
    'Maximum number of critical files to analyze',
    '3'
  )
  .option(
    '-o, --output-dir <path>',
    'Custom output directory for CodeLoom files'
  )
  .option(
    '-l, --max-lines <number>',
    'Maximum number of lines per file to include in analysis',
    '500'
  )
  .option(
    '-n, --model-name <name>',
    'Model name to use for analysis',
    'gemini-1.5-flash-latest'
  )
  .action(async (directoriesArg, options) => {
    printHeader()

    try {
      const rootDir = process.cwd()
      let outputDir =
        options.outputDir ||
        process.env.CODELOOM_OUTPUT_DIR ||
        path.join(rootDir, 'codeloom_out')
      outputDir = await ensureOutputFolder(outputDir)

      const directories = directoriesArg.map((dir) =>
        path.resolve(rootDir, dir)
      )
      const maxCriticalFiles = parseInt(options.maxCriticalFiles, 10)
      const maxLines = parseInt(options.maxLines, 10)
      const modelName = options.modelName

      console.log(chalk.green('Configuration:'))
      console.log(
        chalk.green('- Analyzing directories:'),
        chalk.yellow(directories.join(', '))
      )
      console.log(
        chalk.green('- Maximum critical files:'),
        chalk.yellow(maxCriticalFiles)
      )
      console.log(
        chalk.green('- Maximum lines per file:'),
        chalk.yellow(maxLines)
      )
      console.log(chalk.green('- Model name:'), chalk.yellow(modelName))
      console.log(chalk.green('- Output directory:'), chalk.yellow(outputDir))
      console.log()

      await runCodeLoom(
        directories,
        maxCriticalFiles,
        outputDir,
        maxLines,
        modelName,
        (stage, message) => {
          console.log(chalk.blue(`\n${stage}:`), chalk.white(message))
        }
      )

      console.log(chalk.green('\nCodeLoom analysis completed successfully!'))
    } catch (error) {
      console.error(chalk.red('\nAn error occurred:'), error)
      process.exit(1)
    }
  })

program.parse(process.argv)
