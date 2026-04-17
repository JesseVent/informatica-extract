import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, ArrowRight, Settings, Filter, Search, Target, X, GitMerge, List } from 'lucide-react';
import { ETLMapping, ETLTransformation, ETLLineageStep } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LineageViewProps {
  mapping: ETLMapping;
}

const TRANSFORMATION_GUIDE: Record<string, { description: string; icon: React.ReactNode }> = {
  'Expression': { 
    description: 'Performs row-level calculations and data manipulation using Informatica functions.',
    icon: <Settings className="w-4 h-4" />
  },
  'Filter': { 
    description: 'Filters rows out of the pipeline based on a specified condition.',
    icon: <Filter className="w-4 h-4" />
  },
  'Lookup': { 
    description: 'Retrieves data from a relational table, flat file, or cache based on a key.',
    icon: <Search className="w-4 h-4" />
  },
  'Router': { 
    description: 'Routes data to multiple output groups based on different filter conditions.',
    icon: <GitMerge className="w-4 h-4" />
  },
  'Aggregator': { 
    description: 'Performs aggregate calculations such as SUM, AVG, COUNT, or MAX/MIN.',
    icon: <Database className="w-4 h-4" />
  },
  'Joiner': { 
    description: 'Joins two heterogeneous data sources based on a common join condition.',
    icon: <GitMerge className="w-4 h-4" />
  },
  'Update Strategy': { 
    description: 'Flags rows for insert, update, delete, or reject based on business logic.',
    icon: <Target className="w-4 h-4" />
  },
  'Sorter': { 
    description: 'Sorts data in ascending or descending order based on specified keys.',
    icon: <List className="w-4 h-4" />
  }
};

export function LineageView({ mapping }: LineageViewProps) {
  const [selectedTx, setSelectedTx] = useState<ETLTransformation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTransformations = mapping.transformations.filter(tx => 
    tx.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTxGuide = (type: string) => {
    const key = Object.keys(TRANSFORMATION_GUIDE).find(k => type.includes(k));
    return key ? TRANSFORMATION_GUIDE[key] : { description: 'Standard ETL transformation step.', icon: <Settings className="w-4 h-4" /> };
  };

  const getFieldLineage = (txName: string) => {
    const inputs = mapping.lineage.filter(l => l.to === txName).map(l => {
      const source = mapping.sources.find(s => s.name === l.from);
      const transformation = mapping.transformations.find(t => t.name === l.from);
      return { ...l, originType: source ? 'Source' : transformation ? 'Transformation' : 'Unknown' };
    });
    
    const outputs = mapping.lineage.filter(l => l.from === txName).map(l => {
      const target = mapping.targets.find(t => t.name === l.to);
      const transformation = mapping.transformations.find(t => t.name === l.to);
      return { ...l, destinationType: target ? 'Target' : transformation ? 'Transformation' : 'Unknown' };
    });
    
    return { inputs, outputs };
  };

  return (
    <div className="flex h-full relative overflow-hidden bg-white border border-border rounded-xl shadow-sm">
      {/* Decorative background grid */}
      <div className="absolute inset-0 canvas-bg opacity-50 pointer-events-none" />
      
      {/* Main Flow Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <div className="p-4 border-b border-border flex items-center justify-between bg-white/80 backdrop-blur-sm">
          <h2 className="text-sm font-bold tracking-tight uppercase text-muted-foreground flex items-center gap-2">
            <GitMerge className="w-4 h-4" />
            Mapping Flow
          </h2>
          <Badge variant="outline" className="font-mono text-[10px] bg-background">
            {mapping.transformations.length} STEPS
          </Badge>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-auto p-8 flex items-start gap-12 min-h-[500px] scrollbar-hide">
          {/* Sources */}
          <div className="flex flex-col gap-6 min-w-[200px]">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
              <Database className="w-3 h-3" /> Sources
            </div>
            {mapping.sources.map((source, i) => (
              <motion.div
                key={source.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-4 border-2 border-green-600/20 shadow-sm hover:shadow-md transition-shadow bg-white">
                  <span className="text-[9px] font-bold uppercase text-green-600 block mb-1">Source Table</span>
                  <p className="text-xs font-bold truncate" title={source.name}>{source.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-1">{source.database}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Transformations */}
          <div className="flex flex-col gap-6 min-w-[280px]">
            <div className="flex flex-col gap-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Settings className="w-3 h-3" /> Transformations
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search steps..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-muted/50 border border-border rounded-md text-xs focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-muted-foreground/60 transition-all font-medium"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-full transition-colors"
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {filteredTransformations.map((tx, i) => (
                <motion.div
                  key={tx.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                >
                  <Card 
                    onClick={() => setSelectedTx(tx)}
                    className={`p-4 cursor-pointer border-2 shadow-sm hover:shadow-md transition-all bg-white relative group ${
                      selectedTx?.name === tx.name ? 'ring-2 ring-primary ring-offset-2' : ''
                    } ${
                      tx.type.includes('Filter') ? 'border-orange-500/20' : 
                      tx.type.includes('Lookup') ? 'border-purple-500/20' : 
                      'border-blue-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded ${
                        tx.type.includes('Filter') ? 'bg-orange-500/10 text-orange-600' : 
                        tx.type.includes('Lookup') ? 'bg-purple-500/10 text-purple-600' : 
                        'bg-blue-500/10 text-blue-600'
                      }`}>
                        {tx.type.includes('Filter') ? (
                          <Filter className="w-3.5 h-3.5" />
                        ) : tx.type.includes('Lookup') ? (
                          <Search className="w-3.5 h-3.5" />
                        ) : (
                          <Settings className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className={`text-[9px] font-bold uppercase block mb-0.5 ${
                          tx.type.includes('Filter') ? 'text-orange-600' : 
                          tx.type.includes('Lookup') ? 'text-purple-600' : 
                          'text-blue-600'
                        }`}>{tx.type}</span>
                        <p className="text-xs font-bold truncate">{tx.name}</p>
                        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <List className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">View Field Lineage</span>
                        </div>
                      </div>
                    </div>
                    {selectedTx?.name === tx.name && (
                      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full flex items-center justify-center shadow-lg">
                        <ArrowRight className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
              {filteredTransformations.length === 0 && searchQuery && (
                <div className="p-8 text-center border-2 border-dashed border-border rounded-xl">
                  <Search className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-30" />
                  <p className="text-xs text-muted-foreground font-medium">No results for "{searchQuery}"</p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => setSearchQuery('')}
                    className="mt-1 text-primary text-[10px] font-bold h-auto p-0"
                  >
                    Clear filter
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Targets */}
          <div className="flex flex-col gap-6 min-w-[200px]">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
              <Target className="w-3 h-3" /> Targets
            </div>
            {mapping.targets.map((target, i) => (
              <motion.div
                key={target.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <Card className="p-4 border-2 border-orange-600/20 shadow-sm hover:shadow-md transition-shadow bg-white">
                  <span className="text-[9px] font-bold uppercase text-orange-600 block mb-1">Target Table</span>
                  <p className="text-xs font-bold truncate" title={target.name}>{target.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-1">{target.database}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Side Panel: Transformation Details & Field Lineage */}
      <AnimatePresence>
        {selectedTx && (
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-96 border-l border-border bg-white shadow-2xl relative z-20 flex flex-col"
          >
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold truncate max-w-[200px]">{selectedTx.name}</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedTx(null)} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Type & Description */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {getTxGuide(selectedTx.type).icon}
                  </div>
                  <div>
                    <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider mb-1">
                      {selectedTx.type}
                    </Badge>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      {getTxGuide(selectedTx.type).description}
                    </p>
                  </div>
                </div>
                
                {selectedTx.description && (
                  <div className="p-3 bg-muted/30 border border-border/50 rounded-lg">
                    <p className="text-xs text-muted-foreground leading-relaxed italic">
                      "{selectedTx.description}"
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Transformation Logic */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <List className="w-3 h-3" /> Transformation Logic
                  </div>
                  {selectedTx.logic && (
                    <Badge variant="outline" className="text-[8px] h-4 px-1 opacity-50">DETERMINISTIC</Badge>
                  )}
                </div>
                {selectedTx.logic ? (
                  <div className="group relative">
                    <div className="bg-slate-950 rounded-lg p-4 font-mono text-[11px] leading-relaxed text-slate-300 border border-slate-800 whitespace-pre-wrap overflow-x-auto max-h-[300px] scrollbar-thin scrollbar-thumb-slate-800">
                      {selectedTx.logic}
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white hover:bg-slate-800" onClick={() => navigator.clipboard.writeText(selectedTx.logic || '')}>
                        <List className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic p-6 border border-dashed border-border rounded-lg text-center bg-muted/10">
                    No complex logic or expressions defined for this step.
                  </div>
                )}
              </div>

              <Separator />

              {/* Field-Level Lineage */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <GitMerge className="w-3 h-3" /> Field Lineage
                </div>
                
                <div className="space-y-6">
                  {/* Inputs */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Incoming Fields (Upstream)
                    </p>
                    <div className="space-y-2">
                      {getFieldLineage(selectedTx.name).inputs.map((l, i) => (
                        <div key={i} className="p-2.5 bg-green-50/30 border border-green-100 rounded-lg text-[11px] space-y-2">
                          <div className="flex items-center justify-between text-green-800 font-bold">
                            <span className="truncate" title={l.toField}>{l.toField}</span>
                            <Badge variant="outline" className="text-[8px] h-4 px-1 bg-green-100/50 border-green-200 text-green-700">IN</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground text-[10px] bg-white/50 p-1.5 rounded border border-green-100/50">
                            <ArrowRight className="w-3 h-3 rotate-180 text-green-400 shrink-0" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="font-bold text-foreground truncate">{l.fromField}</span>
                                <Badge className={`text-[8px] h-3 px-1 font-black uppercase ${
                                  l.originType === 'Source' ? 'bg-green-600' : 'bg-blue-600'
                                }`}>{l.originType}</Badge>
                              </div>
                              <div className="text-[9px] text-muted-foreground truncate italic">
                                from <span className="font-bold text-primary/80 not-italic">{l.from}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {getFieldLineage(selectedTx.name).inputs.length === 0 && (
                        <p className="text-[10px] text-muted-foreground italic px-2">No input fields detected.</p>
                      )}
                    </div>
                  </div>

                  {/* Outputs */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Outgoing Fields (Downstream)
                    </p>
                    <div className="space-y-2">
                      {getFieldLineage(selectedTx.name).outputs.map((l, i) => (
                        <div key={i} className="p-2.5 bg-blue-50/30 border border-blue-100 rounded-lg text-[11px] space-y-2">
                          <div className="flex items-center justify-between text-blue-800 font-bold">
                            <span className="truncate" title={l.fromField}>{l.fromField}</span>
                            <Badge variant="outline" className="text-[8px] h-4 px-1 bg-blue-100/50 border-blue-200 text-blue-700">OUT</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground text-[10px] bg-white/50 p-1.5 rounded border border-blue-100/50">
                            <ArrowRight className="w-3 h-3 text-blue-400 shrink-0" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="font-bold text-foreground truncate">{l.toField}</span>
                                <Badge className={`text-[8px] h-3 px-1 font-black uppercase ${
                                  l.destinationType === 'Target' ? 'bg-orange-600' : 'bg-blue-600'
                                }`}>{l.destinationType}</Badge>
                              </div>
                              <div className="text-[9px] text-muted-foreground truncate italic">
                                to <span className="font-bold text-primary/80 not-italic">{l.to}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {getFieldLineage(selectedTx.name).outputs.length === 0 && (
                        <p className="text-[10px] text-muted-foreground italic px-2">No output fields detected.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
