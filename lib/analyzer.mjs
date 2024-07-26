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

async function getAIAnalysis(content, analysisType, modelName) {
  const model = genAI.getGenerativeModel({
    model: modelName,
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    },
  })

  let prompt
  if (analysisType === 'organization') {
    prompt = `
      Analyze the following codebase structure and suggest organizational improvements:

      ${JSON.stringify(content, null, 2)}

      Please provide suggestions for:
      1. Improved file/folder organization
      2. Potential modularization
      3. Adherence to best practices for the specific language/framework (if identifiable)
      4. Any other structural improvements

      Format your response as a JSON object with the following structure:
      {
        "overallAssessment": "A brief overall assessment of the codebase structure",
        "suggestions": [
          {
            "type": "The type of suggestion (e.g., 'organization', 'modularization', 'best practice')",
            "description": "Detailed description of the suggestion",
            "impact": "Potential impact of implementing this suggestion"
          }
        ]
      }
    `
  } else if (analysisType === 'criticalFiles') {
    prompt = `
      Analyze the following files and select the most critical ones that need improvement:

      ${JSON.stringify(content, null, 2)}

      Please select up to ${
        content.maxFiles
      } files that are most critical for improvement.
      Consider factors such as code complexity, potential bugs, performance issues, and adherence to best practices.

      Format your response as a JSON object with the following structure:
      {
        "criticalFiles": [
          {
            "path": "Path to the critical file",
            "reason": "Reason why this file is critical for improvement",
            "suggestedImprovements": "Brief description of suggested improvements"
          }
        ]
      }
    `
  }

  try {
    const result = await model.generateContent(prompt)
    const responseText = await result.response.text()

    // Remove any markdown code block syntax
    const cleanedResponse = responseText
      .replace(/```json\n?|\n?```/g, '')
      .trim()

    // Improved JSON extraction
    const extractJSON = (text) => {
      const jsonRegex = /\{(?:[^{}]|(\{(?:[^{}]|\1)*\}))*\}/g
      const matches = text.match(jsonRegex)
      if (matches && matches.length > 0) {
        // Return the largest JSON object found
        return matches.reduce((a, b) => (a.length > b.length ? a : b))
      }
      return null
    }

    // Try to parse the entire response as JSON
    try {
      const parsedResponse = JSON.parse(cleanedResponse)

      // Ensure criticalFiles is always an array
      if (analysisType === 'criticalFiles' && parsedResponse.criticalFiles) {
        parsedResponse.criticalFiles = Array.isArray(
          parsedResponse.criticalFiles
        )
          ? parsedResponse.criticalFiles
          : [parsedResponse.criticalFiles]
      }

      return parsedResponse
    } catch (parseError) {
      console.error(
        chalk.yellow(
          `Failed to parse entire response as JSON. Attempting to extract partial JSON...`
        )
      )

      // If full parsing fails, try to extract the outermost JSON object
      const jsonString = extractJSON(cleanedResponse)
      if (jsonString) {
        try {
          const parsedJSON = JSON.parse(jsonString)

          // Ensure criticalFiles is always an array
          if (analysisType === 'criticalFiles' && parsedJSON.criticalFiles) {
            parsedJSON.criticalFiles = Array.isArray(parsedJSON.criticalFiles)
              ? parsedJSON.criticalFiles
              : [parsedJSON.criticalFiles]
          }

          return parsedJSON
        } catch (innerParseError) {
          console.error(
            chalk.red(
              `Failed to parse extracted JSON: ${innerParseError.message}`
            )
          )
          return {
            error: 'Failed to parse extracted JSON',
            rawResponse: cleanedResponse,
          }
        }
      } else {
        // If no JSON object is found, return the cleaned response as a string
        console.warn(
          chalk.yellow(
            `No valid JSON found in the response. Returning raw text.`
          )
        )
        return { error: 'No valid JSON found', rawResponse: cleanedResponse }
      }
    }
  } catch (error) {
    console.error(chalk.red(`Error in AI analysis for ${analysisType}:`, error))
    return { error: error.message, rawResponse: 'No raw response available' }
  }
}

export async function analyzeCodebase(maxCriticalFiles, outputDir, modelName) {
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
      'organization',
      modelName
    )

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

    // Add delay before the next API call
    await delay(API_CALL_DELAY)

    console.log(chalk.blue('Reading woven codebase...'))
    const wovenCodebase = await readWovenCodebase(wovenCodebaseFile)

    console.log(chalk.blue('Analyzing critical files with AI...'))
    const criticalFilesSuggestions = await getAIAnalysis(
      { files: wovenCodebase, maxFiles: maxCriticalFiles },
      'criticalFiles',
      modelName
    )

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
  } catch (error) {
    console.error(
      chalk.red('An error occurred in CodeLoom AI Optimizer:'),
      error
    )
    throw error // Propagate the error to be handled by the main process
  }
}
