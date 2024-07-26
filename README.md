# CodeLoom

CodeLoom is an AI-powered tool for analyzing and optimizing your codebase structure. It provides insights into your code organization and suggests improvements for critical files.

## Installation

Install CodeLoom globally using npm:

```bash
npm install -g @bilalpm/codeloom
```

This makes the `codeloom` command available system-wide.

## Setup

In your project root, create a `.env.local` file with your Gemini API key:

```
GEMINI_API_KEY=your_api_key_here
```

Make sure to replace `your_api_key_here` with your actual Gemini API key.

## Usage

Navigate to your project directory in the terminal:

```bash
cd path/to/your/project
```

Run CodeLoom:

```bash
codeloom <directories...>
```

For example:

```bash
codeloom src lib
```

This will run CodeLoom on the `src` and `lib` directories with default settings.

### Command-line Options

Customize the analysis with these options:

- `-m, --max-critical-files <number>`: Maximum number of critical files to analyze (default: 3)
- `-o, --output-dir <path>`: Custom output directory for CodeLoom files (default: "./codeloom_out")
- `-l, --max-lines <number>`: Maximum number of lines per file to include in analysis (default: 500)

Example with options:

```bash
codeloom src app -m 5 -l 1000 -o ./codeloom-analysis
```

This command will:

- Analyze the `src` and `app` directories
- Consider up to 5 critical files for optimization
- Include files up to 1000 lines long
- Output results to `./codeloom-analysis` directory

## Output

After running CodeLoom, you'll find a new output directory (default: `codeloom_out`) in your project root. It will contain:

- `codeloom-map.json`: A JSON representation of your codebase structure
- `codeloom-output.txt`: Concatenated content of all analyzed files
- `organization-suggestions.json`: AI-generated suggestions for codebase organization
- `critical-files-suggestions.json`: List of critical files identified by AI

CodeLoom will also provide optimization suggestions for the identified critical files.

## Example Workflow

1. Install CodeLoom:

   ```bash
   npm install -g @bilalpm/codeloom
   ```

2. Set up your API key in `.env.local`

3. Run CodeLoom on your project:

   ```bash
   cd my-project
   codeloom src components -m 5 -l 800
   ```

4. Review the suggestions in `codeloom_out/organization-suggestions.json`

5. Check the optimization suggestions for critical files

6. Apply the changes you agree with and continue development

By following these steps, you can easily integrate CodeLoom into your development workflow to get AI-powered suggestions for code organization and optimization.

## Note

CodeLoom is an AI-powered tool and its suggestions should be reviewed by a developer before implementation. Always back up your code before applying any automated changes.

## License

MIT

## Author

Bilal Tahir
