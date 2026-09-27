import { useRef, useState, useEffect } from "react";
import {
  UploadCloud,
  FileText,
  X,
  RefreshCw,
  Eye,
  CheckCircle,
  AlertCircle,
  FileImage,
  FileSpreadsheet,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface FileUploadProps {
  onAttach?: (entityType: string, entityId: number | string, file: File) => Promise<unknown>;
  onFile?: (name: string) => void; // legacy compatibility
  entityType?: string;
  entityId?: number | string;
  accept?: string; // e.g. ".pdf,.jpg,.png,.docx"
  maxSizeMB?: number; // e.g. 10
  initialFileName?: string | null;
  onRemove?: () => void;
}

export function FileUpload({
  onAttach,
  onFile,
  entityType = "document",
  entityId = "new",
  accept = ".pdf,.jpg,.png,.docx",
  maxSizeMB = 10,
  initialFileName = null,
  onRemove,
}: FileUploadProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  // States
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(initialFileName);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Update fileName when initialFileName changes
  useEffect(() => {
    setFileName(initialFileName);
  }, [initialFileName]);

  const allowedExtensions = accept.split(",").map((ext) => ext.trim().toLowerCase());
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateFile = (selectedFile: File): boolean => {
    setErrorMsg(null);
    const fileExtension = "." + selectedFile.name.split(".").pop()?.toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      setErrorMsg(t("error.invalidType", { accept }));
      return false;
    }

    if (selectedFile.size > maxSizeBytes) {
      setErrorMsg(t("error.fileTooLarge", { maxSize: maxSizeMB }));
      return false;
    }

    return true;
  };

  const handleUpload = async (targetFile: File) => {
    if (!validateFile(targetFile)) return;

    setFile(targetFile);
    setFileName(targetFile.name);
    setFileSize(targetFile.size);
    setUploadProgress(0);
    setErrorMsg(null);

    // Simulate progress bar (determinate)
    let progress = 0;
    const interval = setInterval(async () => {
      progress += Math.floor(Math.random() * 15) + 10;
      if (progress >= 100) {
        progress = 100;
        setUploadProgress(100);
        clearInterval(interval);

        // Simulate 10% chance of random network/upload error for testing, unless it's a retry
        const isErrorSimulated = Math.random() < 0.1;
        if (isErrorSimulated) {
          setErrorMsg(t("error.uploadFailed"));
          setUploadProgress(null);
          return;
        }

        try {
          if (onAttach) {
            await onAttach(entityType, entityId, targetFile);
          }
          if (onFile) {
            onFile(targetFile.name);
          }

          // Set preview URL if it's an image
          if (targetFile.type.startsWith("image/")) {
            setPreviewUrl(URL.createObjectURL(targetFile));
          } else {
            setPreviewUrl(null);
          }
          setUploadProgress(null);
        } catch (err) {
          setErrorMsg(t("error.uploadFailed"));
          setUploadProgress(null);
        }
      } else {
        setUploadProgress(progress);
      }
    }, 150);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleUpload(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleUpload(selectedFile);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setFileName(null);
    setFileSize(null);
    setUploadProgress(null);
    setErrorMsg(null);
    setPreviewUrl(null);
    if (onRemove) {
      onRemove();
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleReplace = (e: React.MouseEvent) => {
    e.stopPropagation();
    inputRef.current?.click();
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (file) {
      handleUpload(file);
    } else {
      inputRef.current?.click();
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = () => {
    if (fileName?.endsWith(".pdf")) return <FileText className="h-8 w-8 text-destructive" />;
    if (fileName?.endsWith(".docx")) return <FileSpreadsheet className="h-8 w-8 text-info" />;
    return <FileImage className="h-8 w-8 text-success" />;
  };

  // State 3: Uploading
  if (uploadProgress !== null) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border-2 border-border p-6 bg-card shadow-soft">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 animate-pulse text-primary" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold" dir="auto">
              {fileName}
            </p>
            <p className="text-xs text-muted-foreground">{t("common.loading")}</p>
          </div>
          <span className="text-sm font-semibold text-primary">{uploadProgress}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-150 ease-out"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      </div>
    );
  }

  // State 4 & 5: Uploaded / Replace
  if (fileName && !errorMsg) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-border p-5 bg-card shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {getFileIcon()}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold" dir="auto">
                {fileName}
              </p>
              <p className="text-xs text-muted-foreground">
                {fileSize ? formatSize(fileSize) : t("status.uploaded")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {previewUrl && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewOpen(true)}
                title={t("common.view")}
              >
                <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReplace}
              className="text-xs font-semibold text-primary hover:bg-primary-soft"
            >
              {t("common.replace")}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Simple inline image preview modal */}
        {previewOpen && previewUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setPreviewOpen(false)}
          >
            <div
              className="relative max-w-3xl max-h-[85vh] rounded-lg overflow-hidden bg-card border shadow-elegant"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 end-2 rounded-full bg-background/80 hover:bg-background z-10"
                onClick={() => setPreviewOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              <img
                src={previewUrl}
                alt={fileName}
                className="max-w-full max-h-[80vh] object-contain"
              />
              <div
                className="p-3 bg-muted/30 border-t text-center text-xs font-medium text-muted-foreground"
                dir="auto"
              >
                {fileName}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // State 1, 2, 6: Empty, Drag-over, Error
  return (
    <div className="flex flex-col gap-2">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-all duration-150 ease-in-out",
          dragOver
            ? "border-primary bg-primary-soft/40"
            : errorMsg
              ? "border-destructive/50 hover:border-destructive bg-destructive-bg/10"
              : "border-border hover:border-primary/50 hover:bg-muted/30",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
        />

        {errorMsg ? (
          <AlertCircle className="h-8 w-8 text-destructive animate-bounce" />
        ) : (
          <UploadCloud
            className={cn(
              "h-8 w-8 transition-transform",
              dragOver ? "scale-110 text-primary" : "text-muted-foreground",
            )}
          />
        )}

        <div className="space-y-1">
          <p className="text-sm font-semibold">
            {dragOver ? t("docs.dropHint") : t("docs.uploadHint")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("docs.formatLimit", { accept, maxSize: maxSizeMB })}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded bg-destructive-bg/30 text-destructive text-xs font-semibold border border-destructive/10 animate-fade-in">
          <span className="flex items-center gap-1.5 min-w-0">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="truncate">{errorMsg}</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetry}
            className="h-7 px-2.5 text-xs text-destructive hover:bg-destructive-bg/50 shrink-0 inline-flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            {t("common.retry")}
          </Button>
        </div>
      )}
    </div>
  );
}
