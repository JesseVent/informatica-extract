import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Info, ListOrdered, Zap, ShieldAlert, Activity } from 'lucide-react';
import { ETLAnalysis } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Terminal } from 'lucide-react';
import { generateSurgicalPrompt } from '../services/analysisService';
import { ETLMapping } from '../types';

interface AnalysisViewProps {
  analysis: ETLAnalysis;
  mapping: ETLMapping;
}

export function AnalysisView({ analysis, mapping }: AnalysisViewProps) {
  const surgicalPrompt = generateSurgicalPrompt(mapping);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(surgicalPrompt);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
      {/* Left Column: Summary & Logic */}
      <div className="lg:col-span-2 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                <Info className="w-4 h-4" />
                Executive Summary
              </CardTitle>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-tight gap-1.5">
                    <Terminal className="w-3 h-3" />
                    View Surgical Prompt
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                      <span>Generated Surgical Prompt</span>
                      <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-2">
                        <Copy className="w-3.5 h-3.5" /> Copy Prompt
                      </Button>
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto mt-4 p-4 bg-muted rounded-md font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                    {surgicalPrompt}
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground">
                {analysis.summary}
              </p>
              <div className="mt-6 flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-tighter">Lineage Depth</span>
                  <span className="text-sm font-bold">{analysis.lineageDepth}</span>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-tighter">Filters Applied</span>
                  <span className="text-sm font-bold">{analysis.filteringSequence.length} Layers</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                <Zap className="w-4 h-4" />
                Key Business Logic
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.businessLogic.map((logic, i) => (
                <div key={i} className="p-4 rounded-md bg-muted/30 border border-border">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h4 className="font-bold text-sm text-primary">{logic.key}</h4>
                    <Badge variant="outline" className="text-[9px] font-bold bg-white">LOGIC</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{logic.description}</p>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-tight">
                    <Activity className="w-3 h-3" />
                    Impact: {logic.impact}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Right Column: Risks & Sequence */}
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border shadow-sm bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                <ShieldAlert className="w-4 h-4" />
                Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {analysis.risks.map((risk, i) => (
                <div key={i} className="flex gap-3 py-3 border-b border-muted last:border-0">
                  <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${
                    risk.severity === 'high' ? 'bg-destructive' : 'bg-orange-500'
                  }`} />
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-bold uppercase tracking-tight">{risk.type}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        risk.severity === 'high' ? 'bg-destructive/10 text-destructive' : 'bg-orange-500/10 text-orange-600'
                      }`}>
                        {risk.severity}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-tight">{risk.description}</p>
                  </div>
                </div>
              ))}
              {analysis.risks.length === 0 && (
                <div className="flex items-center gap-2 text-xs text-green-600 py-2">
                  <CheckCircle2 className="w-4 h-4" />
                  No significant risks identified.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                <ListOrdered className="w-4 h-4" />
                Filtering Sequence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0 relative ml-1.5">
                <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-muted" />
                {analysis.filteringSequence.map((step, i) => (
                  <div key={i} className="relative pl-6 pb-6 last:pb-0">
                    <div className={`absolute left-[-3px] top-1.5 w-2 h-2 rounded-full border-2 border-white ${
                      i < 2 ? 'bg-primary' : 'bg-border'
                    }`} />
                    <p className="text-xs font-bold mb-0.5">Stage {i + 1}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
