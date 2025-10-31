
"use client";

import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UploadCloud, FileText, XCircle as XCircleIcon, CheckCircle as CheckCircleIconLucide } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export interface FileUploadHandles {
  open: () => void;
}

interface FileUploadProps {
  onFileUpload: (file: File) => Promise<void>;
  accept?: Record<string, string[]>;
  maxSize?: number; // in bytes
  disabled?: boolean;
}

export const FileUpload = forwardRef<FileUploadHandles, FileUploadProps>(({
  onFileUpload,
  accept = { 'application/pdf': ['.pdf'] },
  maxSize = 5 * 1024 * 1024, // 5MB default
  disabled = false,
}, ref) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleUpload = useCallback(async (fileToUpload: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + 5;
      });
    }, 100);

    try {
      await onFileUpload(fileToUpload);
      clearInterval(interval);
      setUploadProgress(100);
      toast({ title: t('toasts.uploadSuccessTitle'), description: t('toasts.uploadSuccessDescription', { fileName: fileToUpload.name }) });
    } catch (uploadError: any) {
      clearInterval(interval);
      const uploadErrorMessage = uploadError.message || t('fileUpload.errorUploadFailed');
      setError(uploadErrorMessage);
      toast({ title: t('toasts.uploadFailedTitle'), description: uploadErrorMessage, variant: "destructive" });
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
      setFile(null); // Clear file after attempt
      if (error) setUploadProgress(0);
    }
  }, [onFileUpload, t, toast]);
  
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    if (rejectedFiles && rejectedFiles.length > 0) {
      const firstError = rejectedFiles[0].errors[0];
      let specificError = t('fileUpload.errorFileRejected');
      if (firstError.code === 'file-too-large') {
        specificError = t('fileUpload.errorTooLarge', { maxSizeMB: (maxSize / (1024 * 1024)).toString() });
      } else if (firstError.code === 'file-invalid-type') {
        specificError = t('fileUpload.errorInvalidType');
      }
      setError(specificError);
      toast({ title: t('toasts.uploadErrorTitle'), description: specificError, variant: "destructive" });
      return;
    }
    if (acceptedFiles && acceptedFiles.length > 0) {
      const droppedFile = acceptedFiles[0];
      setFile(droppedFile);
      // Immediately start upload if a file is dropped
      handleUpload(droppedFile);
    }
  }, [maxSize, toast, t, handleUpload]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
    noClick: true, // We will trigger manually or via drop
    disabled: isUploading || disabled,
  });

  useImperativeHandle(ref, () => ({
    open,
  }));

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        onClick={open}
        className={cn(
          `p-8 border-2 border-dashed border-border rounded-lg text-center cursor-pointer transition-colors bg-transparent hover:border-primary`,
          isDragActive ? 'border-primary bg-primary/10' : '',
          (disabled || isUploading) ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
        {isDragActive ? (
          <p className="text-primary">{t('fileUpload.dropPrompt')}</p>
        ) : (
          <p className="text-muted-foreground">{t('fileUpload.dragDropPrompt')}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">{t('fileUpload.dragDropHint', { maxSizeMB: (maxSize / (1024 * 1024)).toString() })}</p>
      </div>

      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      {isUploading && file && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-sm text-muted-foreground text-center">{t('fileUpload.statusProgress', { fileName: file.name, progress: uploadProgress.toString()})}</p>
        </div>
      )}
    </div>
  );
});
FileUpload.displayName = "FileUpload";
