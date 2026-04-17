import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileUploader } from './components/FileUploader';
import { LineageView } from './components/LineageView';
import { AnalysisView } from './components/AnalysisView';
import { parseInformaticaXML } from './services/xmlParser';
import { analyzeETLMapping } from './services/analysisService';
import { ETLMapping, ETLAnalysis, ETLProject, ETLWorkflow, ETLMaplet, ETLParameter } from './types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Database, LayoutDashboard, Network, ShieldCheck, AlertCircle, Workflow, Box, Settings, Search, FileText, ChevronRight, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function App() {
  const [xmlContent, setXmlContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | undefined>();
  const [project, setProject] = useState<ETLProject | null>(null);
  const [selectedMapping, setSelectedMapping] = useState<ETLMapping | null>(null);
  const [analysis, setAnalysis] = useState<ETLAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (content: string) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Starting XML parse...");
      const parsedProject = await parseInformaticaXML(content);
      
      if (parsedProject.mappings.length === 0 && parsedProject.workflows.length === 0) {
        throw new Error("No valid ETL objects found in the XML file.");
      }
      
      setProject(parsedProject);
      if (parsedProject.mappings.length > 0) {
        setSelectedMapping(parsedProject.mappings[0]);
        const result = await analyzeETLMapping(parsedProject.mappings[0]);
        setAnalysis(result);
      }
      setXmlContent(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process XML file.");
      console.error("Upload error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setXmlContent(null);
    setFileName(undefined);
    setProject(null);
    setSelectedMapping(null);
    setAnalysis(null);
    setError(null);
  };

  const handleMappingSelect = async (mapping: ETLMapping) => {
    if (mapping === selectedMapping) return;
    setIsLoading(true);
    setSelectedMapping(mapping);
    try {
      const result = await analyzeETLMapping(mapping);
      setAnalysis(result);
    } catch (err) {
      setError("Failed to analyze mapping.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-white sticky top-0 z-50">
          <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-lg font-bold tracking-tight">ETL Architect Pro</h1>
              {fileName && (
                <span className="ml-4 px-2.5 py-1 bg-background border border-border rounded text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {fileName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {xmlContent && (
                <>
                  <Button variant="outline" size="sm" className="text-xs font-semibold">
                    Export PDF
                  </Button>
                  <Button size="sm" onClick={handleClear} className="text-xs font-bold">
                    Upload New Schema
                  </Button>
                </>
              )}
              <Badge variant="secondary" className="font-mono text-[10px] bg-background border border-border">v1.0.0-BETA</Badge>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden max-w-[1440px] mx-auto w-full relative">
          {/* Global Loader for initial upload */}
          {isLoading && !xmlContent && (
            <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <div className="text-center">
                <h3 className="text-lg font-bold">Processing XML</h3>
                <p className="text-sm text-muted-foreground">Extracting mapping structure and lineage...</p>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {!xmlContent ? (
              <main className="flex-1 p-8 flex items-center justify-center">
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="max-w-2xl w-full"
                >
                  <FileUploader 
                    onUpload={(content) => {
                      setFileName("m_Sales_Transactions_Load.xml");
                      handleUpload(content);
                    }} 
                    onClear={handleClear} 
                    fileName={fileName}
                  />
                  
                  <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Network className="w-5 h-5 text-primary" />
                      <h4 className="font-bold text-sm">Full Lineage</h4>
                      <p className="text-xs text-muted-foreground">Visualize data flow from source tables to final targets with all intermediate steps.</p>
                    </div>
                    <div className="space-y-2">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                      <h4 className="font-bold text-sm">Risk Detection</h4>
                      <p className="text-xs text-muted-foreground">Identify potential data loss, performance bottlenecks, and security vulnerabilities.</p>
                    </div>
                    <div className="space-y-2">
                      <LayoutDashboard className="w-5 h-5 text-primary" />
                      <h4 className="font-bold text-sm">Logic Extraction</h4>
                      <p className="text-xs text-muted-foreground">Automatically extract and describe complex business logic from transformation expressions.</p>
                    </div>
                  </div>
                </motion.div>
              </main>
            ) : (
              <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <aside className="w-64 bg-white border-r border-border p-5 flex flex-col gap-8 overflow-y-auto hidden lg:flex">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-4">Project Explorer</div>
                    <div className="space-y-4">
                      {/* Mappings */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-foreground">Mappings</span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">{project?.mappings.length || 0}</Badge>
                        </div>
                        <div className="space-y-1">
                          {project?.mappings.map((m) => (
                            <div
                              key={m.name}
                              onClick={() => handleMappingSelect(m)}
                              className={`px-3 py-1.5 text-xs rounded-md cursor-pointer transition-colors truncate ${selectedMapping?.name === m.name ? 'bg-primary/5 text-primary font-medium border border-primary/20' : 'text-muted-foreground hover:bg-muted/50'}`}
                            >
                              {m.name}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Workflows */}
                      {project?.workflows && project.workflows.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-foreground">Workflows</span>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">{project.workflows.length}</Badge>
                          </div>
                          <div className="space-y-1">
                            {project.workflows.map((w) => (
                              <div key={w.name} className="px-3 py-1.5 text-xs text-muted-foreground rounded-md hover:bg-muted/50 cursor-pointer transition-colors truncate flex items-center gap-2">
                                <Workflow className="w-3 h-3" />
                                {w.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Maplets */}
                      {project?.maplets && project.maplets.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-foreground">Maplets</span>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">{project.maplets.length}</Badge>
                          </div>
                          <div className="space-y-1">
                            {project.maplets.map((m) => (
                              <div key={m.name} className="px-3 py-1.5 text-xs text-muted-foreground rounded-md hover:bg-muted/50 cursor-pointer transition-colors truncate flex items-center gap-2">
                                <Box className="w-3 h-3" />
                                {m.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Parameters */}
                      {project?.parameters && project.parameters.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-foreground">Parameters</span>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">{project.parameters.length}</Badge>
                          </div>
                          <div className="space-y-1">
                            {project.parameters.slice(0, 5).map((p) => (
                              <div key={p.name} className="px-3 py-1.5 text-[10px] font-mono text-muted-foreground truncate bg-muted/30 rounded border border-border/50">
                                {p.name}
                              </div>
                            ))}
                            {project.parameters.length > 5 && <div className="text-[9px] text-center text-muted-foreground">+{project.parameters.length - 5} more</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 canvas-bg">
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold tracking-tight">Pipeline Visualization</h2>
                      <div className="text-xs text-muted-foreground">
                        Mapping: {selectedMapping?.name} | Depth: {analysis?.lineageDepth || 'N/A'}
                      </div>
                    </div>

                    {isLoading ? (
                      <Card className="p-24 flex flex-col items-center justify-center text-center gap-4 border-dashed">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <div>
                          <h3 className="text-lg font-bold">Analyzing ETL Schema</h3>
                          <p className="text-sm text-muted-foreground">Gemini is processing the transformation logic and data lineage...</p>
                        </div>
                      </Card>
                    ) : error ? (
                      <Card className="p-12 border-destructive/20 bg-destructive/5 flex flex-col items-center justify-center text-center gap-4">
                        <AlertCircle className="w-12 h-12 text-destructive" />
                        <div>
                          <h3 className="text-lg font-bold text-destructive">Analysis Failed</h3>
                          <p className="text-sm text-muted-foreground">{error}</p>
                        </div>
                        <Button onClick={handleClear}>Try Again</Button>
                      </Card>
                    ) : (
                      <Tabs defaultValue="lineage" className="w-full">
                        <TabsList className="bg-white border border-border p-1 h-10 w-fit mb-6">
                          <TabsTrigger value="lineage" className="text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-none">
                            <Network className="w-3.5 h-3.5 mr-2" /> Lineage
                          </TabsTrigger>
                          <TabsTrigger value="analysis" className="text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-none">
                            <LayoutDashboard className="w-3.5 h-3.5 mr-2" /> Analysis
                          </TabsTrigger>
                          <TabsTrigger value="workflow" className="text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-none">
                            <Workflow className="w-3.5 h-3.5 mr-2" /> Workflow
                          </TabsTrigger>
                          <TabsTrigger value="params" className="text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-none">
                            <Settings className="w-3.5 h-3.5 mr-2" /> Parameters
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="lineage" className="mt-0 flex-1 overflow-hidden">
                          {selectedMapping && <LineageView mapping={selectedMapping} />}
                        </TabsContent>
                        
                        <TabsContent value="analysis" className="mt-0">
                          {analysis && selectedMapping && (
                            <AnalysisView analysis={analysis} mapping={selectedMapping} />
                          )}
                        </TabsContent>

                        <TabsContent value="workflow" className="mt-0">
                          <div className="grid grid-cols-1 gap-6">
                            {project?.workflows.map((w, i) => (
                              <Card key={i} className="border-border shadow-sm">
                                <CardHeader className="pb-3 border-b bg-muted/20">
                                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Workflow className="w-4 h-4 text-primary" />
                                    {w.name}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                  <div className="space-y-4">
                                    <div>
                                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Session Execution Order</div>
                                      <div className="flex flex-wrap gap-2">
                                        {w.sessions.map((s, j) => (
                                          <div key={j} className="flex items-center gap-2">
                                            <Badge variant="secondary" className="text-[10px] font-medium">{s}</Badge>
                                            {j < w.sessions.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <Separator />
                                    <div>
                                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Dependency Trigger Map</div>
                                      <div className="space-y-1">
                                        {w.dependencies.map((d, j) => (
                                          <div key={j} className="text-[11px] flex items-center gap-2 text-muted-foreground">
                                            <span className="font-bold text-foreground">{d.from}</span>
                                            <ChevronRight className="w-3 h-3" />
                                            <span className="font-bold text-foreground">{d.to}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                            {(!project?.workflows || project.workflows.length === 0) && (
                              <div className="p-12 text-center border-2 border-dashed border-border rounded-2xl">
                                <Workflow className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                                <p className="text-sm text-muted-foreground font-medium">No workflows detected in this XML.</p>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="params" className="mt-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {project?.parameters.map((p, i) => (
                              <Card key={i} className="border-border shadow-sm">
                                <CardHeader className="py-3 border-b bg-muted/20">
                                  <CardTitle className="text-[11px] font-mono text-primary truncate">{p.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="py-3 font-mono text-[10px] text-muted-foreground break-all">
                                  {p.value}
                                </CardContent>
                              </Card>
                            ))}
                            {(!project?.parameters || project.parameters.length === 0) && (
                              <div className="col-span-full p-12 text-center border-2 border-dashed border-border rounded-2xl">
                                <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                                <p className="text-sm text-muted-foreground font-medium">No parameters or variables detected in this XML.</p>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    )}
                  </motion.div>
                </main>

                {/* Details Sidebar (Optional / Contextual) */}
                {analysis && !isLoading && (
                  <aside className="w-72 bg-white border-l border-border p-5 flex flex-col gap-8 overflow-y-auto hidden xl:flex">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-4">Key Business Logic</div>
                      <div className="space-y-3">
                        {analysis.businessLogic.slice(0, 3).map((logic, i) => (
                          <div key={i} className="p-3 bg-muted/50 border border-border rounded-md">
                            <h4 className="text-xs font-bold text-primary mb-1">{logic.key}</h4>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">{logic.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-4">Identified Risks</div>
                      <div className="space-y-3">
                        {analysis.risks.map((risk, i) => (
                          <div key={i} className="flex gap-3 items-start">
                            <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${risk.severity === 'high' ? 'bg-destructive' : 'bg-orange-500'}`} />
                            <div>
                              <div className="text-xs font-bold">{risk.type}</div>
                              <div className="text-[11px] text-muted-foreground">{risk.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </aside>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </TooltipProvider>
  );
}
