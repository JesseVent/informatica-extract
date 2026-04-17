import { ETLMapping, ETLAnalysis, ETLTransformation } from "../types";

/**
 * Identifies "hotspots" in the ETL mapping for the surgical prompt.
 */
function extractSurgicalContext(mapping: ETLMapping) {
  const hotspots = mapping.transformations.filter(tx => {
    if (!tx.logic) return false;
    if (tx.logic.length < 10) return false;
    const keyTypes = ['Expression', 'Filter', 'Router', 'Lookup', 'Aggregator', 'Joiner'];
    return keyTypes.some(type => tx.type.includes(type));
  });

  const sortedHotspots = hotspots
    .sort((a, b) => (b.logic?.length || 0) - (a.logic?.length || 0))
    .slice(0, 20);

  return {
    mappingName: mapping.name,
    sourceNames: mapping.sources.map(s => s.name),
    targetNames: mapping.targets.map(t => t.name),
    hotspots: sortedHotspots,
    totalTransformations: mapping.transformations.length,
    lineageSample: mapping.lineage.slice(0, 20).map(l => `${l.from} -> ${l.to}`)
  };
}

export function generateSurgicalPrompt(mapping: ETLMapping) {
  const context = extractSurgicalContext(mapping);
  
  return `
    You are an expert ETL Architect. Analyze this "Surgical Context" from an Informatica PowerCenter mapping.
    Do NOT go blindly looking through the whole file; focus ONLY on the provided hotspots and structural metadata.

    CONTEXT:
    - Mapping: ${context.mappingName}
    - Pipeline: [${context.sourceNames.join(', ')}] -> (${context.totalTransformations} steps) -> [${context.targetNames.join(', ')}]
    - Critical Lineage Path (Sample): ${context.lineageSample.join(', ')}
    
    LOGIC HOTSPOTS (Analyze these for business meaning):
    ${context.hotspots.map(h => `
    [${h.type}] ${h.name}:
    ${h.logic}
    `).join('\n')}

    TASK:
    1. Summarize the high-level data movement and purpose.
    2. Extract the core Business Logic from the Hotspots.
    3. Identify the Filtering Sequence.
    4. Assess Risks based on the logic.

    OUTPUT: Return a JSON object with: summary, businessLogic[], risks[], lineageDepth, filteringSequence[].
  `;
}

/**
 * Deterministically analyzes the ETL mapping without using an AI model.
 */
export async function analyzeETLMapping(mapping: ETLMapping): Promise<ETLAnalysis> {
  // 1. Generate Summary
  const summary = `This ETL mapping "${mapping.name}" processes data from ${mapping.sources.length} source(s) and loads it into ${mapping.targets.length} target(s) through a pipeline of ${mapping.transformations.length} transformation steps.`;

  // 2. Extract Business Logic (Deterministic)
  const businessLogic = mapping.transformations
    .filter(tx => tx.logic && tx.logic.length > 20)
    .slice(0, 5)
    .map(tx => ({
      key: tx.name,
      description: tx.logic?.split('\n')[0] || "Transformation logic applied.",
      impact: `Affects data flow in the ${tx.type} stage.`
    }));

  // 3. Identify Risks (Pattern-based)
  const risks: ETLAnalysis['risks'] = [];
  
  // Check for many-to-one targets
  if (mapping.targets.length > 5) {
    risks.push({
      type: 'performance',
      description: "High number of targets detected. Monitor for load performance bottlenecks.",
      severity: 'medium'
    });
  }

  // Check for complex lookups
  const lookups = mapping.transformations.filter(tx => tx.type.includes('Lookup'));
  if (lookups.length > 3) {
    risks.push({
      type: 'performance',
      description: `Detected ${lookups.length} lookups. High lookup count can impact session performance.`,
      severity: 'medium'
    });
  }

  // Check for filters
  const filters = mapping.transformations.filter(tx => tx.type.includes('Filter') || tx.type.includes('Router'));
  if (filters.length === 0) {
    risks.push({
      type: 'consistency',
      description: "No explicit filters detected. Ensure data quality is handled upstream.",
      severity: 'low'
    });
  }

  // 4. Lineage Depth
  const lineageDepth = `${mapping.lineage.length} connectors across ${mapping.transformations.length} transformation instances.`;

  // 5. Filtering Sequence
  const filteringSequence = mapping.transformations
    .filter(tx => tx.type.includes('Filter') || tx.type.includes('Router') || tx.type.includes('Source Qualifier'))
    .map(tx => tx.name);

  return {
    summary,
    businessLogic: businessLogic.length > 0 ? businessLogic : [{ key: "General Flow", description: "Standard data movement logic.", impact: "Maintains data integrity." }],
    risks: risks.length > 0 ? risks : [{ type: 'consistency', description: "No immediate structural risks detected.", severity: 'low' }],
    lineageDepth,
    filteringSequence: filteringSequence.length > 0 ? filteringSequence : ["Source Extraction"]
  };
}
