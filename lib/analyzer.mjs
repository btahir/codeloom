import { promises as fs } from 'fs'
import path from 'path'
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai'
import dotenv from 'dotenv'
import chalk from 'chalk'

dotenv.config({ path: '.env.local' })

const CODELOOM_DELIMITER = '//==== CODELOOM_DELIMITER ====/'
const API_KEY = process.env.GEMINI_API_KEY
const API_CALL_DELAY = 1000 // 1 second delay between API calls

if (!API_KEY) {
  console.error(chalk.red('GEMINI_API_KEY environment variable is not set'))
  process.exit(1)
}

const genAI = new GoogleGenerativeAI(API_KEY)

async function readCodebaseMap(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error(chalk.red(`Error reading codebase map: ${error.message}`))
    throw error
  }
}

async function readWovenCodebase(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8')
    const files = data.split(CODELOOM_DELIMITER).filter(Boolean)
    return files.map((file) => {
      const [filePath, ...content] = file.trim().split('\n')
      return {
        path: filePath.replace('FILE_PATH: ', '').trim(),
        content: content.join('\n').trim(),
      }
    })
  } catch (error) {
    console.error(chalk.red(`Error reading woven codebase: ${error.message}`))
    throw error
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function getAIAnalysis(content, analysisType) {
  // ... (rest of the function remains the same)
}

export async function analyzeCodebase(maxCriticalFiles, outputDir) {
  console.log(chalk.cyan('\nWelcome to CodeLoom AI Optimizer v2'))

  const rootDir = process.cwd()
  console.log(chalk.cyan(`Using root directory: ${rootDir}`))

  const codebaseMapFile = path.join(outputDir, 'codeloom-map.json')
  const wovenCodebaseFile = path.join(outputDir, 'codeloom-output.txt')
  const organizationSuggestionsFile = path.join(
    outputDir,
    'organization-suggestions.json'
  )
  const criticalFilesSuggestionsFile = path.join(
    outputDir,
    'critical-files-suggestions.json'
  )

  try {
    console.log(chalk.blue('Reading codebase map...'))
    const codebaseMap = await readCodebaseMap(codebaseMapFile)

    console.log(chalk.blue('Analyzing codebase structure with AI...'))
    const organizationSuggestions = await getAIAnalysis(
      codebaseMap,
      'organization'
    )

    if (organizationSuggestions && !organizationSuggestions.error) {
      console.log(chalk.green('Writing AI organization suggestions...'))
      await fs.writeFile(
        organizationSuggestionsFile,
        JSON.stringify(organizationSuggestions, null, 2)
      )
      console.log(
        chalk.green(
          `AI Organization suggestions saved to ${organizationSuggestionsFile}`
        )
      )
    } else {
      console.log(
        chalk.yellow(
          'Failed to generate organization suggestions. Saving raw response...'
        )
      )
      await fs.writeFile(
        organizationSuggestionsFile,
        JSON.stringify(
          {
            error: organizationSuggestions.error,
            rawResponse: organizationSuggestions.rawResponse,
          },
          null,
          2
        )
      )
    }

    // Add delay before the next API call
    await delay(API_CALL_DELAY)

    console.log(chalk.blue('Reading woven codebase...'))
    const wovenCodebase = await readWovenCodebase(wovenCodebaseFile)

    console.log(chalk.blue('Analyzing critical files with AI...'))
    const criticalFilesSuggestions = await getAIAnalysis(
      { files: wovenCodebase, maxFiles: maxCriticalFiles },
      'criticalFiles'
    )

    if (criticalFilesSuggestions && !criticalFilesSuggestions.error) {
      console.log(chalk.green('Writing AI critical files suggestions...'))
      await fs.writeFile(
        criticalFilesSuggestionsFile,
        JSON.stringify(criticalFilesSuggestions, null, 2)
      )
      console.log(
        chalk.green(
          `AI Critical Files suggestions saved to ${criticalFilesSuggestionsFile}`
        )
      )
    } else {
      console.log(
        chalk.yellow(
          'Failed to generate critical files suggestions. Saving raw response...'
        )
      )
      await fs.writeFile(
        criticalFilesSuggestionsFile,
        JSON.stringify(
          {
            error: criticalFilesSuggestions.error,
            rawResponse: criticalFilesSuggestions.rawResponse,
          },
          null,
          2
        )
      )
    }
  } catch (error) {
    console.error(
      chalk.red('An error occurred in CodeLoom AI Optimizer:'),
      error
    )
  }
}
