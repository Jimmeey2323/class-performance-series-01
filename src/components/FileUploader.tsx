
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileUp } from 'lucide-react';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].name.endsWith('.zip')) {
      onFileUpload(files[0]);
    } else {
      alert('Please upload a valid ZIP file.');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (e.target.files[0].name.endsWith('.zip')) {
        onFileUpload(e.target.files[0]);
      } else {
        alert('Please upload a valid ZIP file.');
      }
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div
        className={`
          relative rounded-lg border-2 border-dashed p-12 text-center transition-all
          ${isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/30'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="bg-primary/10 p-3 rounded-full">
            <Upload className="h-10 w-10 text-primary" />
          </div>
          <div className="flex flex-col space-y-1 text-center">
            <h3 className="text-lg font-semibold">Upload Your ZIP File</h3>
            <p className="text-sm text-muted-foreground">
              Drag and drop your ZIP file here or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Your file should contain the aggregated class data in CSV format
            </p>
          </div>
          <Button type="button" className="mt-2">
            <FileUp className="mr-2 h-4 w-4" />
            Select File
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".zip"
          onChange={handleFileInput}
        />
      </div>
    </div>
  );
};

export default FileUploader;
