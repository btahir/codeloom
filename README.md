# CodeLoom

CodeLoom is an AI-powered tool for analyzing and optimizing your codebase structure. It provides insights into your code organization and suggests improvements for critical files.

## Installation and Usage

You can use CodeLoom either by installing it globally or by running it directly with npx.

### Global Installation

1. Install CodeLoom globally using npm:

   ```bash
   npm install -g @bilalpm/codeloom
   ```

2. Use CodeLoom in any project:

   ```bash
   cd path/to/your/project
   codeloom <directories...>
   ```

### Using npx (No Installation Required)

If you prefer not to install CodeLoom globally, you can use npx to run it directly:

```bash
npx @bilalpm/codeloom <directories...>
```

## Setup

Before using CodeLoom, create a `.env.local` file in your project root with your Gemini API key:

```
GEMINI_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with your actual Gemini API key.

## Usage Examples

Analyze specific directories:

```bash
codeloom app lib  # If installed globally
npx @bilalpm/codeloom app lib  # Using npx
```

Use command-line options:

```bash
codeloom app -m 5 -l 1000 -o ./codeloom-analysis  # If installed globally
npx @bilalpm/codeloom app components -m 5 -l 1000 -o ./codeloom-analysis  # Using npx
```

This command will:

- Analyze the `app` and `components` directories
- Consider up to 5 critical files for optimization
- Include files up to 1000 lines long
- Output results to `./codeloom-analysis` directory

### Command-line Options

- `-m, --max-critical-files <number>`: Maximum number of critical files to analyze (default: 3)
- `-o, --output-dir <path>`: Custom output directory for CodeLoom files (default: "./codeloom_out")
- `-l, --max-lines <number>`: Maximum number of lines per file to include in analysis (default: 500)

## Output

After running CodeLoom, you'll find a new output directory (default: `codeloom_out`) in your project root. It will contain:

- `codeloom-map.json`: A JSON representation of your codebase structure
- `codeloom-output.txt`: Concatenated content of all analyzed files
- `organization-suggestions.json`: AI-generated suggestions for codebase organization
- `critical-files-suggestions.json`: List of critical files identified by AI
- `optimized_files/`: Directory containing optimized versions of critical files

CodeLoom will provide optimization suggestions for the identified critical files, saving the optimized versions in the `optimized_files/` directory while preserving the original file structure.

## Note

CodeLoom is an AI-powered tool and its suggestions should be reviewed by a developer before implementation. Always back up your code before applying any automated changes.

## License

MIT

## Author

Bilal Tahir
