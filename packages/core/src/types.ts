export type OutputFormat = "webp" | "avif" | "png" | "jpg";

export type SuffixStyle = "dash" | "at" | "w";

export type ConvertOptions = {
  inputDir: string;
  outputDir: string;
  format: OutputFormat;
  quality: number;
  sizes: number[];
  includeOriginal: boolean;
  suffixStyle: SuffixStyle;
  keepFolders: boolean;
  concurrency: number;
};

export type ProgressEvent =
  | { type: "scan_start" }
  | { type: "scan_done"; fileCount: number }
  | { type: "file_start"; inputPath: string }
  | { type: "file_done"; inputPath: string; outputs: string[] }
  | { type: "file_error"; inputPath: string; error: string }
  | { type: "all_done"; outputDir: string; successCount: number; errorCount: number };
