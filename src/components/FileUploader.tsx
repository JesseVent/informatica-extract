import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface FileUploaderProps {
  onUpload: (content: string) => void;
  onClear: () => void;
  fileName?: string;
}

export function FileUploader({ onUpload, onClear, fileName }: FileUploaderProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onUpload(content);
      };
      reader.readAsText(file);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/xml': ['.xml'] },
    multiple: false
  } as any);

  if (fileName) {
    return (
      <Card className="p-6 flex items-center justify-between border-2 border-primary/20 bg-white shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold">{fileName}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">XML Schema Loaded</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClear} className="hover:bg-destructive/10 hover:text-destructive transition-colors">
          <X className="w-5 h-5" />
        </Button>
      </Card>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-xl p-16 transition-all cursor-pointer
        flex flex-col items-center justify-center text-center gap-6 bg-white shadow-sm
        ${isDragActive ? 'border-primary bg-primary/5 scale-[0.99]' : 'border-border hover:border-primary/50 hover:shadow-md'}
      `}
    >
      <input {...getInputProps()} />
      <div className="p-5 bg-primary/10 rounded-full">
        <Upload className="w-10 h-10 text-primary" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold tracking-tight">Upload ETL Schema</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Drag and drop your Informatica PowerCenter XML export here, or click to browse.
        </p>
      </div>
      <Button variant="default" className="mt-2 font-bold px-8">
        Select XML File
      </Button>
    </div>
  );
}
