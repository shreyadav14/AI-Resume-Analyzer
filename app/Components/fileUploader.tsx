import React from 'react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploaderProps {
  onFileSelect?: (file: File) => void;
}

const FileUploader = ({ onFileSelect }: FileUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file: File | null = acceptedFiles[0] || null;

      setFile(file);

      if (file && onFileSelect) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <>
      <div className="w-full gradient-border">FileUploader</div>

      <div {...getRootProps()}>
        <input {...getInputProps()} />

        <div className="space-y-4 cursor-pointer">
          <div className="mx-auto w-16 h-16 flex items-center justify-center">
            <img
              src="/icons/info.svg"
              alt="upload icon"
              className="size-20"
            />
          </div>

          {file ? (
            <div>
              <p>{file.name}</p>
            </div>
          ) : (
            <div>
              <p className="text-lg text-gray-500">
                <span className="font-semibold">Click to Upload</span> or drag
                and drop
              </p>

              <p className="text-lg text-gray-500">PDF (max 20MB)</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FileUploader;