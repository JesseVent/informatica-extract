import React from 'react';
import { motion } from 'motion/react';
import { Database, ArrowRight, GitBranch, Layout, PlayCircle } from 'lucide-react';
import { ETLProject, ETLMapping } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PipelineOverviewProps {
  project: ETLProject;
  onSelectMapping: (mapping: ETLMapping) => void;
}

interface MappingNode {
  mapping: ETLMapping;
  upstream: string[];
  downstream: string[];
}

export function PipelineOverview({ project, onSelectMapping }: PipelineOverviewProps) {
  // Infer connections between mappings
  // Mapping A -> Mapping B if A's target name exists as B's source name
  const mappingNodes: MappingNode[] = project.mappings.map(m => {
    const upstream = project.mappings
      .filter(other => other.name !== m.name && other.targets.some(t => m.sources.some(s => s.name === t.name)))
      .map(other => other.name);
    
    const downstream = project.mappings
      .filter(other => other.name !== m.name && other.sources.some(s => m.targets.some(t => t.name === s.name)))
      .map(other => other.name);

    return { mapping: m, upstream, downstream };
  });

  // Calculate stats
  const totalSources = new Set(project.mappings.flatMap(m => m.sources.map(s => s.name))).size;
  const totalTargets = new Set(project.mappings.flatMap(m => m.targets.map(t => t.name))).size;

  return (
    <div className="space-y-8 pb-12">
      {/* High-Level Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Mappings', value: project.mappings.length, icon: Layout, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Workflows', value: project.workflows.length, icon: PlayCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Unique Sources', value: totalSources, icon: Database, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Final Targets', value: totalTargets, icon: GitBranch, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((stat, i) => (
          <Card key={i} className="border-border shadow-sm overflow-hidden">
            <div className={`h-1 ${stat.bg.replace('50', '500')}`} />
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-black tabular-nums">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <GitBranch className="w-4 h-4" /> End-to-End Pipeline Map
        </h3>
        
        <div className="flex flex-col gap-8 p-6 bg-white border border-border rounded-xl shadow-inner min-h-[400px] overflow-x-auto overflow-y-visible relative scrollbar-hide">
          <div className="absolute inset-0 canvas-bg opacity-30 pointer-events-none" />
          
          <div className="flex items-center gap-12 min-w-max relative z-10">
            {mappingNodes.map((node, i) => (
              <React.Fragment key={node.mapping.name}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative group"
                >
                  <Card 
                    className={`w-64 border-2 transition-all hover:shadow-xl hover:-translate-y-1 ${
                      node.upstream.length > 0 || node.downstream.length > 0
                        ? 'border-primary/40 bg-primary/5 shadow-md'
                        : 'border-border bg-white shadow-sm'
                    }`}
                  >
                    <CardHeader className="p-4 border-b border-border bg-white/50">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-tighter h-4">Mapping</Badge>
                        {node.upstream.length > 0 && (
                          <div className="flex items-center gap-1 text-[8px] text-primary font-black animate-pulse">
                            <ArrowRight className="w-2 h-2 rotate-180" /> LINKED
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-xs font-black truncate" title={node.mapping.name}>
                        {node.mapping.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div className="space-y-2">
                        <div className="text-[9px] font-bold text-muted-foreground uppercase flex items-center justify-between">
                          <span>Inputs</span>
                          <span className="bg-green-100 text-green-700 px-1 rounded">{node.mapping.sources.length}</span>
                        </div>
                        <div className="space-y-1">
                          {node.mapping.sources.slice(0, 2).map((s, j) => (
                            <div key={j} className="text-[10px] truncate flex items-center gap-1.5 p-1.5 bg-background border border-border rounded">
                              <Database className="w-2.5 h-2.5 text-green-600 shrink-0" />
                              <span className="truncate">{s.name}</span>
                            </div>
                          ))}
                          {node.mapping.sources.length > 2 && (
                            <div className="text-[9px] text-center text-muted-foreground">+{node.mapping.sources.length - 2} more</div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-[9px] font-bold text-muted-foreground uppercase flex items-center justify-between">
                          <span>Outputs</span>
                          <span className="bg-orange-100 text-orange-700 px-1 rounded">{node.mapping.targets.length}</span>
                        </div>
                        <div className="space-y-1">
                          {node.mapping.targets.slice(0, 2).map((t, j) => (
                            <div key={j} className="text-[10px] truncate flex items-center gap-1.5 p-1.5 bg-background border border-border rounded">
                              <Database className="w-2.5 h-2.5 text-orange-600 shrink-0" />
                              <span className="truncate">{t.name}</span>
                            </div>
                          ))}
                          {node.mapping.targets.length > 2 && (
                            <div className="text-[9px] text-center text-muted-foreground">+{node.mapping.targets.length - 2} more</div>
                          )}
                        </div>
                      </div>

                      <Button 
                        onClick={() => onSelectMapping(node.mapping)}
                        variant="default" 
                        size="sm" 
                        className="w-full text-[10px] font-bold h-8 tracking-wide uppercase"
                      >
                        Deep Dive Lineage
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Visual Connections to downstream nodes */}
                  {node.downstream.length > 0 && (
                    <div className="absolute top-1/2 -right-12 w-12 h-0.5 bg-primary/20 -translate-y-1/2 overflow-hidden">
                      <motion.div 
                        animate={{ x: [0, 48] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        className="w-1/2 h-full bg-primary"
                      />
                    </div>
                  )}
                </motion.div>

                {i < mappingNodes.length - 1 && node.downstream.length === 0 && (
                  <div className="w-12 border-t-2 border-dashed border-border flex items-center justify-center shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="mt-8 p-4 bg-muted/30 border border-border/50 rounded-lg flex items-center gap-4 text-xs text-muted-foreground italic">
            <Badge variant="outline" className="bg-white shrink-0">HEURISTIC ENGINE</Badge>
            The pipeline above is inferred by correlating shared Source and Target table names across independent mappings.
          </div>
        </div>
      </div>

      {/* Cross-Mapping Impact Analysis */}
      <Card className="border-border">
        <CardHeader className="bg-muted/10 border-b">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
             <Layout className="w-4 h-4" /> Global Impact Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Critical Hubs (Shared Tables)</h4>
              <div className="space-y-2">
                {Array.from(new Set(project.mappings.flatMap(m => m.targets.map(t => t.name))))
                  .filter(targetName => project.mappings.some(m => m.sources.some(s => s.name === targetName)))
                  .slice(0, 5)
                  .map((hub, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted/20 rounded border border-border/50">
                      <div className="flex items-center gap-2">
                        <Database className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-mono font-bold truncate max-w-[200px]">{hub}</span>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 text-[9px] font-black uppercase">Inter-Mapping Link</Badge>
                    </div>
                  ))}
                {Array.from(new Set(project.mappings.flatMap(m => m.targets.map(t => t.name))))
                  .filter(targetName => project.mappings.some(m => m.sources.some(s => s.name === targetName)))
                  .length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No shared tables (hubs) detected between mappings in this XML.</p>
                  )}
              </div>
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Pipeline Characteristics</h4>
              <ul className="space-y-3">
                <li className="text-xs flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
                  <span>The project consists of <strong>{project.mappings.length}</strong> core mappings driven by <strong>{project.workflows.length}</strong> workflows.</span>
                </li>
                <li className="text-xs flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
                  <span>Heuristic inference identified <strong>{mappingNodes.filter(n => n.upstream.length > 0 || n.downstream.length > 0).length}</strong> connected processing stages.</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
