import { mapCodebase } from './mapper.mjs'
import { concatenateFiles } from './concatenator.mjs'
import { analyzeCodebase } from './analyzer.mjs'
import { optimizeFiles } from './file-optimizer.mjs'
import path from 'path'

async function runCodeLoom(directories, maxCriticalFiles, outputDir) {
  console.log('🚀 Starting CodeLoom analysis and optimization')

  try {
    const rootDir = process.cwd()

    console.log('🗺️  Mapping codebase...')
    await mapCodebase(directories, maxCriticalFiles, outputDir)

    console.log('📄 Concatenating files...')
    await concatenateFiles(rootDir, outputDir)

    console.log('🧠 Analyzing codebase...')
    await analyzeCodebase(maxCriticalFiles, outputDir)

    console.log('✨ Optimizing critical files...')
    await optimizeFiles(rootDir, outputDir)

    console.log('🎉 CodeLoom process complete!')
  } catch (error) {
    console.error('An error occurred during CodeLoom execution:', error)
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
