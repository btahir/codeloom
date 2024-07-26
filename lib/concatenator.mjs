import { promises as fs } from 'fs'
import path from 'path'

const BINARY_CHECK_BYTES = 8000
const CODELOOM_DELIMITER = '//==== CODELOOM_DELIMITER ====/'

async function readCodebaseMap(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error(`Error reading codebase map: ${error.message}`)
    throw error
  }
}

function isBinaryContent(buffer) {
  for (let i = 0; i < Math.min(buffer.length, BINARY_CHECK_BYTES); i++) {
    if (buffer[i] === 0) return true
  }
  return false
}

async function weaveCodebase(codebaseMap, rootDir, outputFile) {
  const fileStream = await fs.open(outputFile, 'w')

  async function processNode(node, currentPath) {
    if (node.type === 'file') {
      const filePath = path.join(currentPath, node.name)
      const fullPath = path.resolve(rootDir, filePath)

      await fileStream.write(`\n\n${CODELOOM_DELIMITER}\n`)
      await fileStream.write(`FILE_PATH: ${filePath}\n`)
      await fileStream.write(`${CODELOOM_DELIMITER}\n`)

      try {
        const content = await fs.readFile(fullPath)
        if (isBinaryContent(content)) {
          await fileStream.write('[Binary file content not included]\n')
        } else {
          await fileStream.write(content.toString('utf8'))
        }
      } catch (error) {
        console.error(`Error reading file ${fullPath}:`, error)
        await fileStream.write(`Error reading file: ${error.message}\n`)
      }
    } else if (node.type === 'directory' && node.children) {
      for (const child of node.children) {
        await processNode(child, path.join(currentPath, node.name))
      }
    }
  }

  for (const child of codebaseMap.children) {
    await processNode(child, '')
  }

  await fileStream.close()
}

export async function concatenateFiles(rootDir, outputDir) {
  console.log('Welcome to CodeLoom - Weaving your codebase together')
  console.log('Using root directory:', rootDir)
  console.log('Using output directory:', outputDir)

  const codebaseMapFile = path.join(outputDir, 'codeloom-map.json')
  const outputFile = path.join(outputDir, 'codeloom-output.txt')

  console.log('Reading codebase map...')
  const codebaseMap = await readCodebaseMap(codebaseMapFile)

  console.log('Weaving codebase...')
  await weaveCodebase(codebaseMap, rootDir, outputFile)

  console.log(`CodeLoom finished. Woven codebase saved to ${outputFile}`)
}
