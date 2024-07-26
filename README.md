# Using CodeLoom

CodeLoom is an AI-powered tool for analyzing and optimizing your codebase structure. Here's how to use it in your project:

## Installation

1. Install CodeLoom globally using npm:

```bash
npm install -g codeloom
```

This makes the `codeloom` command available system-wide.

## Setup

2. In your project root, create a `.env.local` file with your Gemini API key:

```
GEMINI_API_KEY=your_api_key_here
```

Make sure to replace `your_api_key_here` with your actual Gemini API key.

## Usage

3. Navigate to your project directory in the terminal:

```bash
cd path/to/your/project
```

4. Run CodeLoom:

```bash
codeloom
```

This will run CodeLoom with default settings, analyzing the `src` and `lib` directories and considering up to 3 critical files.

5. To customize the analysis, you can use command-line options:

```bash
codeloom -d app,components,utils -m 5
```

This command will:

- Analyze the `app`, `components`, and `utils` directories
- Consider up to 5 critical files for optimization

Available options:

- `-d, --directories <dirs>`: Comma-separated list of directories to analyze (default: "src,lib")
- `-m, --max-critical-files <number>`: Maximum number of critical files to analyze (default: 3)

## Output

After running CodeLoom, you'll find a new `codeloom_out` directory in your project root. It will contain:

- `codeloom-map.json`: A JSON representation of your codebase structure
- `codeloom-output.txt`: Concatenated content of all analyzed files
- `organization-suggestions.json`: AI-generated suggestions for codebase organization
- `critical-files-suggestions.json`: List of critical files identified by AI

Additionally, CodeLoom will have optimized the identified critical files directly in your project.

## Example Workflow

1. Install CodeLoom:

   ```bash
   npm install -g codeloom
   ```

2. Set up your API key in `.env.local`

3. Run CodeLoom on your React project:

   ```bash
   cd my-react-app
   codeloom -d src,components -m 5
   ```

4. Review the suggestions in `codeloom_out/organization-suggestions.json`

5. Check the optimized files in your project structure

6. Commit the changes you agree with and continue development

By following these steps, you can easily integrate CodeLoom into your development workflow to get AI-powered suggestions for code organization and optimization.
