import { promises as fs } from 'fs'
import path from 'path'

const BINARY_CHECK_BYTES = 8000
const CODE_LOOM_FOLDER = 'codeloom_out'
const CODELOOM_DELIMITER = '//==== CODELOOM_DELIMITER ====//'

async function readCodebaseMap(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`Codebase map file not found: ${filePath}`)
      console.error(
        `Please run the mapping script first to generate the codebase map.`
      )
    } else {
      console.error(`Error reading codebase map: ${error.message}`)
    }
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
    if (
      currentPath.includes('.git') ||
      currentPath.includes(CODE_LOOM_FOLDER)
    ) {
      return
    }

    if (node.type === 'file') {
      const filePath = path.join(currentPath, node.name)
      const adjustedFilePath = filePath.split(path.sep).slice(1).join(path.sep)
      const fullPath = path.resolve(rootDir, adjustedFilePath)

      await fileStream.write(`\n\n${CODELOOM_DELIMITER}\n`)
      await fileStream.write(`FILE_PATH: ${adjustedFilePath}\n`)
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

  await processNode(codebaseMap, '')
  await fileStream.close()
}

async function ensureCodeLoomFolder(rootDir) {
  const codeLoomPath = path.join(rootDir, CODE_LOOM_FOLDER)
  await fs.mkdir(codeLoomPath, { recursive: true })
  return codeLoomPath
}

export async function concatenateFiles() {
  console.log('Welcome to CodeLoom - Weaving your codebase together')

  const args = process.argv.slice(2)
  const rootDir = args[0] || process.cwd()
  console.log('Using root directory:', rootDir)

  const codeLoomFolder = await ensureCodeLoomFolder(rootDir)
  console.log('CodeLoom folder:', codeLoomFolder)

  const codebaseMapFile = path.join(codeLoomFolder, 'codeloom-map.json')
  const outputFile = path.join(codeLoomFolder, 'codeloom-output.txt')

  console.log('Reading codebase map...')
  const codebaseMap = await readCodebaseMap(codebaseMapFile)

  console.log('Weaving codebase...')
  await weaveCodebase(codebaseMap, rootDir, outputFile)

  console.log(`CodeLoom finished. Woven codebase saved to ${outputFile}`)
}
