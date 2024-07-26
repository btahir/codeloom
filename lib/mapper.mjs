import { promises as fs } from 'fs'
import path from 'path'
import ignore from 'ignore'

const CODELOOM_FOLDER = 'codeloom_out'
const DEFAULT_MAX_LINES = 500

async function readGitignore(rootDir) {
  try {
    const gitignorePath = path.join(rootDir, '.gitignore')
    const gitignoreContent = await fs.readFile(gitignorePath, 'utf8')
    return ignore().add(gitignoreContent)
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(
        'No .gitignore file found. Proceeding with default ignore rules.'
      )
      return ignore()
    }
    throw error
  }
}

async function countLines(filePath) {
  const content = await fs.readFile(filePath, 'utf8')
  return content.split('\n').length
}

async function mapDirectory(dirPath, ig, rootDir, maxLines) {
  const result = {
    name: path.basename(dirPath),
    type: 'directory',
    children: [],
  }

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      const relativePath = path.relative(rootDir, fullPath)

      if (ig.ignores(relativePath) || relativePath === CODELOOM_FOLDER) {
        continue
      }

      if (entry.isDirectory()) {
        const subdirMap = await mapDirectory(fullPath, ig, rootDir, maxLines)
        result.children.push(subdirMap)
      } else if (entry.isFile()) {
        const lineCount = await countLines(fullPath)
        if (lineCount <= maxLines) {
          result.children.push({
            name: entry.name,
            type: 'file',
            extension: path.extname(entry.name),
            lines: lineCount,
          })
        } else {
          console.log(`Skipping ${relativePath} (${lineCount} lines)`)
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error)
  }

  return result
}

export async function mapCodebase() {
  const rootDir = process.cwd()
  console.log('Welcome to CodeLoom - Mapping your codebase')
  console.log('Using root directory:', rootDir)

  const codeLoomFolder = path.join(rootDir, CODELOOM_FOLDER)
  await fs.mkdir(codeLoomFolder, { recursive: true })

  const ig = await readGitignore(rootDir)
  ig.add(CODELOOM_FOLDER)

  const [, , directoriesArg, maxLinesArg] = process.argv
  if (!directoriesArg) {
    console.log(
      'Usage: node script.js <comma-separated-directories> [max-lines]'
    )
    return
  }

  const maxLines = parseInt(maxLinesArg) || DEFAULT_MAX_LINES
  console.log(`Max lines per file: ${maxLines}`)

  const directories = directoriesArg
    .split(',')
    .map((dir) => path.join(rootDir, dir.trim()))
  console.log('Mapping directories:', directories)

  const codebaseMap = {
    name: 'root',
    type: 'directory',
    children: [],
  }

  for (const dir of directories) {
    if (await fs.stat(dir).catch(() => null)) {
      const dirMap = await mapDirectory(dir, ig, rootDir, maxLines)
      codebaseMap.children.push(dirMap)
    } else {
      console.log(`Directory ${dir} does not exist.`)
    }
  }

  const outputFile = path.join(codeLoomFolder, 'codeloom-map.json')
  await fs.writeFile(outputFile, JSON.stringify(codebaseMap, null, 2))
  console.log(`Codebase map saved to ${outputFile}`)
}
