import type { Attempt } from '../domain/index.ts';

/** User-facing review data. This does not replace bounded model review evidence. */
export interface ReviewFile {
  path: string;
  oldPath?: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'typechanged' | 'untracked';
  binary: boolean;
  mediaType: string;
  size: number;
  baselineSize: number;
  contentHash?: string;
  baselineContentHash?: string;
  content?: string;
  patch?: string;
  returnedBytes: number;
  totalBytes: number;
  truncated: boolean;
  reason?: string;
  nextOffset?: number;
  patchTruncated?: boolean;
  patchReturnedBytes?: number;
  patchTotalBytes?: number;
}
export interface CandidateReviewDiff {
  candidateId: string;
  baselineHash: string;
  candidateHash: string;
  checkedAt: string;
  files: ReviewFile[];
  complete: boolean;
}
export interface ReviewFileChunk {
  path: string;
  side: 'candidate' | 'baseline';
  offset: number;
  content?: string;
  binary: boolean;
  mediaType: string;
  contentHash: string;
  size: number;
  returnedBytes: number;
  totalBytes: number;
  truncated: boolean;
  reason?: string;
  nextOffset?: number;
  candidateHash: string;
}
export interface AcceptancePrecheck {
  candidateId: string;
  checkedAt: string;
  ready: boolean;
  blockers: { code: string; message: string }[];
  candidateHash?: string;
  baselineHash?: string;
}
export type AttemptSummary = Omit<Attempt, 'prompt' | 'output' | 'guidance' | 'review'> & {
  detailAvailable: true;
  outputPreview?: string;
  guidanceHash?: string;
  reviewPerspective?: string;
};
export interface AttemptPage { items: AttemptSummary[]; total: number; offset: number; nextOffset?: number }
