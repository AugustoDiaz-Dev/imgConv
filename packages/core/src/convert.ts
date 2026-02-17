import path from "path";
import fs from "fs-extra";
import fg from "fast-glob";
import sharp from "sharp";
import { ConvertOptions, ProgressEvent, OutputFormat, SuffixStyle } from "./types";

const IMAGE_EXTS = ["png", "jpg", "jpeg", "webp"];

function clampQuality(q: number) {
  if (!Number.isFinite(q)) return 82;
  return Math.max(1, Math.min(100, Math.round(q)));
}

function formatOutPath(
  basePathNoExt: string,
  width: number | null,
  format: OutputFormat,
  suffixStyle: SuffixStyle
) {
  if (width === null) return `${basePathNoExt}.${format}`;
  const suffix = suffixStyle === "at" ? `@${width}` : `-${width}w`;
  return `${basePathNoExt}${suffix}.${format}`;
}

async function convertOne(params: {
  inputPath: string;
  outFile: string;
  format: OutputFormat;
  quality: number;
  width: number | null;
}) {
  const { inputPath, outFile, format, quality, width } = params;

  let img = sharp(inputPath, { failOn: "none" }).rotate();

  if (width !== null) {
    img = img.resize({ width, withoutEnlargement: true });
  }

  if (format === "webp") img = img.webp({ quality });
  if (format === "avif") img = img.avif({ quality });
  if (format === "png") img = img.png({ compressionLevel: 9 });
  if (format === "jpg") img = img.jpeg({ quality, mozjpeg: true });

  await fs.ensureDir(path.dirname(outFile));
  await img.toFile(outFile);
}

export async function convertFolder(
  opts: ConvertOptions,
  onProgress?: (e: ProgressEvent) => void
) {
  const quality = clampQuality(opts.quality);
  const sizes = [...opts.sizes]
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);

  onProgress?.({ type: "scan_start" });

  const relFiles = await fg(IMAGE_EXTS.map((ext) => `**/*.${ext}`), {
    cwd: opts.inputDir,
    onlyFiles: true,
    dot: false,
  });

  onProgress?.({ type: "scan_done", fileCount: relFiles.length });

  await fs.ensureDir(opts.outputDir);

  let successCount = 0;
  let errorCount = 0;

  const jobs: Array<() => Promise<void>> = [];

  for (const rel of relFiles) {
    const inputPath = path.join(opts.inputDir, rel);
    const parsed = path.parse(rel);

    const outDirForFile = opts.keepFolders
      ? path.join(opts.outputDir, parsed.dir)
      : opts.outputDir;

    const basePathNoExt = path.join(outDirForFile, parsed.name);

    const widths: Array<number | null> = [];
    if (opts.includeOriginal) widths.push(null);
    for (const w of sizes) widths.push(w);

    jobs.push(async () => {
      onProgress?.({ type: "file_start", inputPath });

      const outFiles: string[] = [];
      try {
        for (const w of widths) {
          const outFile = formatOutPath(
            basePathNoExt,
            w,
            opts.format,
            opts.suffixStyle
          );
          outFiles.push(outFile);
          await convertOne({
            inputPath,
            outFile,
            format: opts.format,
            quality,
            width: w,
          });
        }
        successCount += 1;
        onProgress?.({ type: "file_done", inputPath, outputs: outFiles });
      } catch (err: unknown) {
        errorCount += 1;
        const message = err instanceof Error ? err.message : String(err);
        onProgress?.({ type: "file_error", inputPath, error: message });
      }
    });
  }

  const concurrency = Math.max(
    1,
    Math.min(24, Math.round(opts.concurrency || 6))
  );
  let i = 0;

  async function worker() {
    while (i < jobs.length) {
      const myIndex = i++;
      await jobs[myIndex]();
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, jobs.length) },
    () => worker()
  );
  await Promise.all(workers);

  onProgress?.({
    type: "all_done",
    outputDir: opts.outputDir,
    successCount,
    errorCount,
  });

  return { outputDir: opts.outputDir, successCount, errorCount };
}
