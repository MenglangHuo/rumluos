"use client"

import React, { useState, useRef } from "react"
import { uploadFile } from "@/lib/api/endpoints"
import { Button } from "@/components/ui/button"
import { Loader2, UploadCloud, X, FileIcon, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface FileUploadProps {
  onUploadSuccess: (fileKey: string, fileName: string) => void
  accept?: string
  maxSizeMB?: number
  isPublic?: boolean
  folder?: string
}

export function FileUpload({ onUploadSuccess, accept = "*", maxSizeMB = 5, isPublic, folder }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{ name: string; key: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSizeMB}MB`)
      return
    }

    setIsUploading(true)
    try {
      const fileKey = await uploadFile(file, { isPublic, folder })
      setUploadedFile({ name: file.name, key: fileKey })
      onUploadSuccess(fileKey, file.name)
      toast.success("File uploaded successfully")
    } catch (error) {
      toast.error("Failed to upload file")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const triggerSelect = () => {
    fileInputRef.current?.click()
  }

  const clearUpload = () => {
    setUploadedFile(null)
    // Optional: maybe we don't clear the form value here, but this allows replacing it.
  }

  if (uploadedFile) {
    return (
      <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="bg-primary/10 p-2 rounded-md shrink-0">
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>
          <div className="truncate">
            <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
            <p className="text-xs text-muted-foreground">Uploaded successfully</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={clearUpload} className="shrink-0" type="button">
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />
      <div 
        onClick={isUploading ? undefined : triggerSelect}
        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 transition-colors ${
          isUploading ? "opacity-50 cursor-not-allowed bg-muted/50" : "cursor-pointer hover:bg-muted/50 hover:border-primary/50"
        }`}
      >
        <div className="bg-primary/5 p-3 rounded-full">
          {isUploading ? (
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          ) : (
            <UploadCloud className="h-6 w-6 text-primary" />
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">
            {isUploading ? "Uploading..." : "Click to select a file"}
          </p>
          {!isUploading && (
            <p className="text-xs text-muted-foreground mt-1">
              Max file size: {maxSizeMB}MB
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
