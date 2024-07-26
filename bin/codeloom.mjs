#!/usr/bin/env node

import { program } from 'commander'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import fs from 'fs/promises'
import os from 'os'
import { runCodeLoom } from '../lib/index.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

async function ensureOutputFolder(outputDir) {
  try {
    await fs.access(outputDir)
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`Creating output directory: ${outputDir}`)
      await fs.mkdir(outputDir, { recursive: true })
    } else {
      throw error
    }
  }
  return outputDir
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
  .action(async (directoriesArg, options) => {
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

      console.log(`Analyzing directories: ${directories.join(', ')}`)
      console.log(`Maximum critical files: ${maxCriticalFiles}`)
      console.log(`Output directory: ${outputDir}`)

      await runCodeLoom(directories, maxCriticalFiles, outputDir)
    } catch (error) {
      console.error('An error occurred:', error)
      process.exit(1)
    }
  })

program.parse(process.argv)
