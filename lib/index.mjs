import { mapCodebase } from './mapper.mjs'
import { concatenateFiles } from './concatenator.mjs'
import { analyzeCodebase } from './analyzer.mjs'
import { optimizeFiles } from './file-optimizer.mjs'

async function runCodeLoom(directories, maxCriticalFiles, outputDir) {
  console.log('🚀 Starting CodeLoom analysis and optimization')

  try {
    console.log('🗺️  Mapping codebase...')
    await mapCodebase(directories, outputDir)

    console.log('📄 Concatenating files...')
    await concatenateFiles(outputDir)

    console.log('🧠 Analyzing codebase...')
    await analyzeCodebase(maxCriticalFiles, outputDir)

    console.log('✨ Optimizing critical files...')
    await optimizeFiles(outputDir)

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
