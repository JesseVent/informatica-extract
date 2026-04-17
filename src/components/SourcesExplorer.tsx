import { motion } from 'motion/react';
import { Database, Target, Search, FileText, Table } from 'lucide-react';
import { ETLProject } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface SourcesExplorerProps {
  project: ETLProject;
}

export function SourcesExplorer({ project }: SourcesExplorerProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const allSources = Array.from(new Set(project.mappings.flatMap(m => m.sources)));
  const allTargets = Array.from(new Set(project.mappings.flatMap(m => m.targets)));

  const filteredSources = allSources.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.database.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTargets = allTargets.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.database.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Data Catalog</h2>
          <p className="text-xs text-muted-foreground italic">List of all source and target objects identified in the Informatica XML.</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input 
            placeholder="Search tables or DBs..." 
            className="pl-8 text-xs h-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sources Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground pb-2 border-b border-border">
            <Database className="w-3.5 h-3.5 text-green-600" /> Sources ({filteredSources.length})
          </div>
          <div className="grid grid-cols-1 gap-3">
            {filteredSources.map((source, i) => (
              <motion.div
                key={`${source.name}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-border shadow-sm border-l-4 border-l-green-600">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-tighter bg-green-50 text-green-700 border-green-200">SOURCE</Badge>
                      <span className="text-[10px] font-mono text-muted-foreground font-bold">{source.database}</span>
                    </div>
                    <CardTitle className="text-sm font-black flex items-center gap-2">
                      <Table className="w-4 h-4 text-green-600" /> {source.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="mt-3">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase mb-2">Fields ({source.fields.length})</p>
                      <div className="flex flex-wrap gap-1.5 focus-within:ring-0">
                        {source.fields.map((field, j) => (
                          <Badge key={j} variant="secondary" className="text-[10px] font-medium bg-muted/50 border-none px-2 py-0.5">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {filteredSources.length === 0 && (
              <p className="text-xs text-muted-foreground italic text-center py-8">No source tables found.</p>
            )}
          </div>
        </div>

        {/* Targets Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground pb-2 border-b border-border">
            <Target className="w-3.5 h-3.5 text-orange-600" /> Targets ({filteredTargets.length})
          </div>
          <div className="grid grid-cols-1 gap-3">
            {filteredTargets.map((target, i) => (
              <motion.div
                key={`${target.name}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-border shadow-sm border-l-4 border-l-orange-600">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-tighter bg-orange-50 text-orange-700 border-orange-200">TARGET</Badge>
                      <span className="text-[10px] font-mono text-muted-foreground font-bold">{target.database}</span>
                    </div>
                    <CardTitle className="text-sm font-black flex items-center gap-2">
                      <Table className="w-4 h-4 text-orange-600" /> {target.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="mt-3">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase mb-2">Fields ({target.fields.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {target.fields.map((field, j) => (
                          <Badge key={j} variant="secondary" className="text-[10px] font-medium bg-muted/50 border-none px-2 py-0.5">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {filteredTargets.length === 0 && (
              <p className="text-xs text-muted-foreground italic text-center py-8">No target tables found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
