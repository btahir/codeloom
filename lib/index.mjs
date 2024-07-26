import { mapCodebase } from './mapper.mjs'
import { concatenateFiles } from './concatenator.mjs'
import { analyzeCodebase } from './analyzer.mjs'
import { optimizeFiles } from './file-optimizer.mjs'
import path from 'path'
import chalk from 'chalk'

function printSectionHeader(title) {
  console.log('\n' + chalk.cyan('━'.repeat(50)))
  console.log(chalk.cyan.bold(title))
  console.log(chalk.cyan('━'.repeat(50)))
}

async function runCodeLoom(
  directories,
  maxCriticalFiles,
  outputDir,
  maxLines = 500
) {
  console.log(
    chalk.bold.magenta('\n🚀 Starting CodeLoom analysis and optimization\n')
  )

  try {
    const rootDir = process.cwd()

    printSectionHeader('🗺️  Mapping codebase')
    await mapCodebase(directories, maxLines, outputDir)
    console.log(chalk.green('Mapping complete!'))

    console.log('\n') // Add an empty line for separation

    printSectionHeader('📄 Concatenating files')
    await concatenateFiles(rootDir, outputDir)
    console.log(chalk.green('Concatenation complete!'))

    console.log('\n') // Add an empty line for separation

    printSectionHeader('🧠 Analyzing codebase')
    await analyzeCodebase(maxCriticalFiles, outputDir)
    console.log(chalk.green('Analysis complete!'))

    console.log('\n') // Add an empty line for separation

    printSectionHeader('✨ Optimizing critical files')
    await optimizeFiles(rootDir, outputDir)
    console.log(chalk.green('Optimization complete!'))

    console.log('\n') // Add an empty line for separation

    console.log(chalk.bold.green('🎉 CodeLoom process complete!'))
    console.log(chalk.cyan('━'.repeat(50)))
  } catch (error) {
    console.error(
      chalk.red('\nAn error occurred during CodeLoom execution:'),
      error
    )
    throw error
  }
}

export {
  runCodeLoom,
  mapCodebase,
  concatenateFiles,
  analyzeCodebase,
  optimizeFiles,
}
