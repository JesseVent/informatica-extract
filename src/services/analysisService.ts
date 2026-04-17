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

  // 2. Extract Business Logic (Deterministic & Robust)
  // Look for transformations that typically contain core logic
  const priorities = ['Expression', 'Aggregator', 'Filter', 'Router', 'Joiner', 'Lookup'];
  
  const transformationsWithLogic = mapping.transformations
    .filter(tx => (tx.logic && tx.logic.length > 5) || (tx.description && tx.description.length > 5))
    .sort((a, b) => {
      // Prioritize type
      const aScore = priorities.findIndex(p => a.type.includes(p)) + 1;
      const bScore = priorities.findIndex(p => b.type.includes(p)) + 1;
      if (aScore !== bScore) return bScore - aScore;
      // Then length
      return (b.logic?.length || 0) - (a.logic?.length || 0);
    });

  const businessLogic = transformationsWithLogic
    .slice(0, 8)
    .map(tx => {
      let desc = "Transformation logic applied.";
      if (tx.logic) {
        const lines = tx.logic.split('\n').filter(l => l.trim().length > 0);
        desc = lines[0] || desc;
      } else if (tx.description) {
        desc = tx.description;
      }

      return {
        key: tx.name,
        description: desc,
        impact: `Functional role: ${tx.type} logic processing.`
      };
    });

  // 3. Identify Risks (Pattern-based)
  const risks: ETLAnalysis['risks'] = [];
  
  // High transformation count
  if (mapping.transformations.length > 15) {
    risks.push({
      type: 'performance',
      description: `High complexity mapping (${mapping.transformations.length} transformations). Complex execution plan may impact load windows.`,
      severity: 'medium'
    });
  }

  // Check for many-to-one targets
  if (mapping.targets.length > 3) {
    risks.push({
      type: 'consistency',
      description: "Multiple targets loaded in a single mapping. Verify commit boundaries and transaction management.",
      severity: 'medium'
    });
  }

  // Check for complex lookups (uncached potential)
  const lookups = mapping.transformations.filter(tx => tx.type.toLowerCase().includes('lookup'));
  if (lookups.length > 5) {
    risks.push({
      type: 'performance',
      description: `Detected ${lookups.length} lookups. If large tables are involved, verify Cache management to prevent I/O bottlenecks.`,
      severity: 'high'
    });
  }

  // 4. Lineage Depth
  const lineageDepth = `${mapping.lineage.length} connectors | ${mapping.transformations.length} steps`;

  // 5. Filtering Sequence
  const filteringSequence = mapping.transformations
    .filter(tx => 
      tx.type.includes('Filter') || 
      tx.type.includes('Router') || 
      tx.type.includes('Source Qualifier') || 
      tx.type.includes('Aggregator')
    )
    .map(tx => tx.name);

  return {
    summary,
    businessLogic: businessLogic.length > 0 ? businessLogic : [
      { key: "Data Pipeline", description: `Processing ${mapping.sources.length} sources into ${mapping.targets.length} targets.`, impact: "Core pipeline flow." }
    ],
    risks: risks.length > 0 ? risks : [{ type: 'consistency', description: "Mapping structure follows standard patterns. No critical risks detected.", severity: 'low' }],
    lineageDepth,
    filteringSequence: filteringSequence.length > 0 ? filteringSequence : ["Source Qualifier"]
  };
}
