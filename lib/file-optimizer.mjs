import { promises as fs } from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai'

dotenv.config({ path: '.env.local' })

const CODE_LOOM_FOLDER = 'codeloom_out'
const API_KEY = process.env.GEMINI_API_KEY

if (!API_KEY) {
  console.error('GEMINI_API_KEY environment variable is not set')
  process.exit(1)
}

const genAI = new GoogleGenerativeAI(API_KEY)

async function readJSONFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error(`Error reading file: ${error.message}`)
    throw error
  }
}

async function readFileContent(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8')
  } catch (error) {
    console.error(`Error reading file: ${error.message}`)
    throw error
  }
}

async function writeFileContent(filePath, content) {
  try {
    await fs.writeFile(filePath, content, 'utf8')
    console.log(`File updated: ${filePath}`)
  } catch (error) {
    console.error(`Error writing file: ${error.message}`)
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

export async function optimizeFiles() {
  console.log('Welcome to CodeLoom File Optimizer')

  const rootDir = process.cwd()
  console.log('Using root directory:', rootDir)

  const codeLoomFolder = path.join(rootDir, CODE_LOOM_FOLDER)
  const criticalFilesPath = path.join(
    codeLoomFolder,
    'critical-files-suggestions.json'
  )

  console.log('Reading critical files suggestions...')
  const { criticalFiles } = await readJSONFile(criticalFilesPath)

  for (const file of criticalFiles) {
    console.log(`\nOptimizing file: ${file.path}`)
    const filePath = path.join(rootDir, file.path)

    try {
      const fileContent = await readFileContent(filePath)
      console.log('File content read successfully.')
      console.log('Sending to AI for optimization...')
      const optimizedContent = await optimizeFile(
        file.path,
        fileContent,
        file.reason,
        file.suggestedImprovements
      )

      if (optimizedContent !== fileContent.trim()) {
        console.log('Writing optimized content...')
        await writeFileContent(filePath, optimizedContent)
      } else {
        console.log('No changes were necessary for this file.')
      }
    } catch (error) {
      console.error(`Error processing file ${file.path}:`, error)
    }
  }

  console.log('\nFile optimization complete!')
}
