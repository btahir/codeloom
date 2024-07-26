import { promises as fs } from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai'
import chalk from 'chalk'

dotenv.config({ path: '.env.local' })

const API_KEY = process.env.GEMINI_API_KEY

if (!API_KEY) {
  console.error(chalk.red('GEMINI_API_KEY environment variable is not set'))
  process.exit(1)
}

const genAI = new GoogleGenerativeAI(API_KEY)

async function readJSONFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error(chalk.red(`Error reading file: ${error.message}`))
    throw error
  }
}

async function readFileContent(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8')
  } catch (error) {
    console.error(chalk.red(`Error reading file: ${error.message}`))
    throw error
  }
}

async function writeFileContent(filePath, content) {
  try {
    // Ensure the directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, content, 'utf8')
    console.log(chalk.green(`File updated: ${filePath}`))
  } catch (error) {
    console.error(chalk.red(`Error writing file: ${error.message}`))
    throw error
  }
}

async function optimizeFile(
  filePath,
  fileContent,
  reason,
  suggestedImprovements
) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash-latest',
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

  const prompt = `
    You are an expert code optimizer. Please review and optimize the following file, focusing only on critical changes:
    
    File path: ${filePath}
    Reason for optimization: ${reason}
    Suggested improvements: ${suggestedImprovements}

    Current file content:
    \`\`\`
    ${fileContent}
    \`\`\`

    Instructions:
    1. Focus only on critical changes that significantly improve the code.
    2. If the file is already well-optimized, it's okay to make no changes.
    3. Do not add any new dependencies, libraries or imports that are not already present in the project.
    4. Maintain the existing code structure and style unless a change is critically necessary.
    5. Provide only the optimized code without any explanations or markdown formatting.

    If no changes are necessary, return the original code as-is.
  `

  const result = await model.generateContent(prompt)
  const rawResponse = await result.response.text()
  // console.log('AI response received.', rawResponse)

  // Extract code content from the response
  const codeRegex = /```(?:[\w-]+)?\s*([\s\S]*?)\s*```|^[\s\S]+$/
  const match = rawResponse.match(codeRegex)

  if (match) {
    return match[1] ? match[1].trim() : rawResponse.trim()
  } else {
    console.warn(
      'No code block or content found in the AI response. Using the full response.'
    )
    return rawResponse.trim()
  }
}

export async function optimizeFiles(rootDir, outputDir) {
  console.log(chalk.cyan('\nWelcome to CodeLoom File Optimizer'))
  console.log(chalk.cyan(`Using root directory: ${rootDir}`))
  console.log(chalk.cyan(`Using output directory: ${outputDir}`))

  const criticalFilesPath = path.join(
    outputDir,
    'critical-files-suggestions.json'
  )

  const optimizedOutputDir = path.join(outputDir, 'optimized_files')
  console.log(
    chalk.cyan(`Optimized files will be saved in: ${optimizedOutputDir}`)
  )

  console.log(chalk.blue('Reading critical files suggestions...'))
  const { criticalFiles } = await readJSONFile(criticalFilesPath)

  for (const file of criticalFiles) {
    // Remove any CODELOOM_DELIMITER and FILE_PATH: prefix from the file path
    const cleanFilePath = file.path
      .replace(/\/\/==== CODELOOM_DELIMITER ====\/\nFILE_PATH: /, '')
      .trim()
    console.log(chalk.blue(`\nOptimizing file: ${cleanFilePath}`))

    const originalFilePath = path.join(rootDir, cleanFilePath)
    const optimizedFilePath = path.join(optimizedOutputDir, cleanFilePath)

    try {
      const fileContent = await readFileContent(originalFilePath)
      console.log(chalk.green('File content read successfully.'))
      console.log(chalk.blue('Sending to AI for optimization...'))
      const optimizedContent = await optimizeFile(
        cleanFilePath,
        fileContent,
        file.reason,
        file.suggestedImprovements
      )

      if (optimizedContent !== fileContent.trim()) {
        console.log(
          chalk.green('Changes detected. Writing optimized content...')
        )
        await writeFileContent(optimizedFilePath, optimizedContent)
        console.log(
          chalk.green(`Optimized file saved to: ${optimizedFilePath}`)
        )
      } else {
        console.log(chalk.yellow('No changes were necessary for this file.'))
        // Optionally, you can still copy the original file to the optimized directory
        await writeFileContent(optimizedFilePath, fileContent)
        console.log(
          chalk.yellow(`Original file copied to: ${optimizedFilePath}`)
        )
      }
    } catch (error) {
      console.error(
        chalk.red(`Error processing file ${originalFilePath}:`),
        error
      )
    }
  }

  console.log(chalk.green('\nFile optimization complete!'))
  console.log(
    chalk.cyan(`Optimized files are available in: ${optimizedOutputDir}`)
  )
}
