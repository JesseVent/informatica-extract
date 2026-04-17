export interface ETLSource {
  name: string;
  database: string;
  fields: string[];
}

export interface ETLTarget {
  name: string;
  database: string;
  fields: string[];
}

export interface ETLTransformation {
  name: string;
  type: string;
  description?: string;
  logic?: string;
}

export interface ETLLineageStep {
  from: string;
  to: string;
  fromField?: string;
  toField?: string;
}

export interface ETLMapping {
  name: string;
  sources: ETLSource[];
  targets: ETLTarget[];
  transformations: ETLTransformation[];
  lineage: ETLLineageStep[];
}

export interface ETLWorkflow {
  name: string;
  description?: string;
  sessions: string[];
  dependencies: { from: string; to: string }[];
}

export interface ETLMaplet {
  name: string;
  transformations: ETLTransformation[];
}

export interface ETLParameter {
  name: string;
  value: string;
}

export interface ETLProject {
  mappings: ETLMapping[];
  workflows: ETLWorkflow[];
  maplets: ETLMaplet[];
  parameters: ETLParameter[];
}

export interface ETLAnalysis {
  summary: string;
  businessLogic: {
    key: string;
    description: string;
    impact: string;
  }[];
  risks: {
    type: 'security' | 'performance' | 'consistency';
    description: string;
    severity: 'low' | 'medium' | 'high';
  }[];
  lineageDepth: string;
  filteringSequence: string[];
}
