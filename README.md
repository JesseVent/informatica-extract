# Informatica Extract

A web-based ETL schema analyzer that parses Informatica PowerCenter XML export files and visualizes data lineage, transformations, and business logic. Understand complex ETL mappings, identify risks, and generate reports—all in the browser.

**View your app in AI Studio:** https://ai.studio/apps/7a40dae0-cb05-473a-a292-3082a7c7858e

## Features

- **🔍 Full Lineage Visualization** — Interactive D3.js network graphs showing data flow from source tables through transformations to targets
- **⚠️ Risk Detection** — Automatically identify performance bottlenecks, consistency issues, and security vulnerabilities in your mappings
- **💡 Logic Extraction** — Extract and describe complex business logic from transformation expressions using pattern analysis
- **📊 Pipeline Overview** — High-level statistics and structure summary of all mappings, workflows, and maplets
- **📁 Data Catalog** — Browse all sources, targets, and their fields in one place
- **⚙️ Parameter Tracking** — View all ETL variables and parameters defined in your project
- **📄 PDF Export** — Generate comprehensive reports of your ETL analysis

## Stack

- **Frontend:** React 19 + TypeScript
- **Build Tool:** Vite 6.2
- **Visualization:** D3.js + Recharts
- **UI Framework:** Base UI + Shadcn components + Tailwind CSS
- **Animations:** Motion
- **APIs:** Google Genai (Gemini) for semantic analysis
- **Export:** jsPDF + jspdf-autotable

## Project Structure

```
src/
  App.tsx                   Main app container; orchestrates upload, tabs, and views
  types.ts                  ETL data models (ETLMapping, ETLWorkflow, ETLProject, etc.)
  main.tsx                  React entry point
  index.css                 Global styles

  components/
    FileUploader.tsx        Drag-drop file upload widget
    LineageView.tsx         D3-based network graph for data flow visualization
    AnalysisView.tsx        Risk and business logic summary display
    PipelineOverview.tsx    Mapping statistics and structure overview
    SourcesExplorer.tsx     Data catalog with sources, targets, and field listings

  services/
    xmlParser.ts            DOMParser-based Informatica XML extraction
                            Parses MAPPING, SESSION, WORKFLOW, MAPLET, PARAMETER tags
    analysisService.ts      Pattern-based risk detection and business logic extraction
                            Identifies complexity, lookup caching, transaction boundaries
    reportService.ts        PDF report generation using jsPDF

lib/
  utils.ts                  Shared utility functions

components/ui/            Shadcn/Base UI component library exports
vite.config.ts            Build configuration with Tailwind + React plugin
```

## How It Works

1. **Upload** — Drag and drop or select an Informatica PowerCenter XML export file
2. **Parse** — The `xmlParser` service extracts mappings, workflows, transformations, and lineage into a normalized `ETLProject` object
3. **Analyze** — `analysisService` identifies risks (complexity, uncached lookups) and extracts business logic from transformations
4. **Visualize** — Browse multiple views:
   - **Pipeline Overview** — Mappings, statistics, and dependencies
   - **Lineage** — D3 force-directed graph of data flow
   - **Security & Risks** — Detected issues and their severity
   - **Workflows** — Execution order and task dependencies
   - **Data Catalog** — All sources, targets, and fields
   - **Parameters** — All ETL variables and their values
5. **Export** — Generate a PDF report of your analysis

## Run Locally

**Prerequisites:** Node.js 18+

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   
   Copy `.env.local` (or create it) and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` — Start Vite dev server (port 3000)
- `npm run build` — Build for production
- `npm run preview` — Preview production build locally
- `npm run clean` — Remove dist directory
- `npm run lint` — Run TypeScript type checking

## Key Features Explained

### Lineage Graph
The **Lineage** tab displays a D3 force-directed graph showing the complete data flow:
- **Nodes** represent sources, transformations, and targets
- **Edges** show field-level connections between components
- **Interactive** — Drag to reposition, hover for details

### Risk Detection
`analysisService` identifies three risk categories:

- **Performance:** High transformation count (>15), many lookups (>5) without caching
- **Consistency:** Multiple targets in a single mapping (transaction boundary issues)
- **Security:** Complex filtering sequences with potential data loss

Each risk is categorized as `low`, `medium`, or `high` severity.

### Business Logic Extraction
The service prioritizes transformations by type (Expression, Aggregator, Filter, Router, Joiner, Lookup) and extracts:
- **Key** — Transformation name
- **Description** — First line of logic or description field
- **Impact** — Functional role in the pipeline

### PDF Export
Generate a comprehensive report including:
- Project summary
- Mapping details and statistics
- Risk analysis
- Business logic overview
- Data lineage diagrams

## Supported Informatica Objects

The parser extracts:
- **MAPPING** — Core data transformation logic
- **SESSION** — Execution configuration and parameters
- **WORKFLOW** — Task orchestration and dependencies
- **MAPLET** — Reusable transformation components
- **PARAMETER** — Variables (names starting with `$` or `$$`)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key for AI-powered analysis | Yes |
| `DISABLE_HMR` | Disable Hot Module Reloading (set to `true` in AI Studio) | No |

## Development Notes

### Adding Custom Risk Rules

Edit `src/services/analysisService.ts` in the `analyzeETLMapping()` function to add domain-specific patterns:

```typescript
// Example: Detect data quality transformations
if (mapping.transformations.some(tx => tx.type.includes('Data Quality'))) {
  risks.push({
    type: 'consistency',
    description: 'Data quality checks detected. Verify error handling.',
    severity: 'low'
  });
}
```

### Extending the Lineage Graph

The `LineageView` component uses D3.js. Key considerations:
- Force simulation parameters (strength, distance) affect layout
- Node positions are constrained to prevent overlap
- Zoom and pan are enabled by default

### Using Gemini for Semantic Analysis

The `generateSurgicalPrompt()` function in `analysisService.ts` scaffolds AI analysis. To enable:

1. Call `generateSurgicalPrompt(mapping)` to create a prompt
2. Send to Gemini API
3. Parse response and update analysis state

## Limitations

- Only parses standard Informatica PowerCenter XML format (v10+)
- Large mappings (>100 transformations) may experience performance lag in the lineage graph
- PDF export may have layout issues with extremely complex mappings
- Deterministic risk detection is pattern-based; semantic analysis requires Gemini API

## Future Enhancements

- [ ] Semantic analysis using Gemini for business logic extraction
- [ ] Impact analysis and dependency tracking across mappings
- [ ] Custom rule builder for risk detection
- [ ] Export to multiple formats (JSON, CSV, Parquet)
- [ ] Diff tool for comparing mapping versions
- [ ] Integration with data governance platforms

## License

This project is open source and available under the MIT License.

## Support

For issues, feature requests, or contributions, please open an issue or pull request on GitHub.
