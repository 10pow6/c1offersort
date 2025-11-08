import type { SortResult } from "@/types";
import "./StatusMessage.css";

interface ProgressUpdate {
  type: "pagination" | "sorting";
  offersLoaded?: number;
  pagesLoaded?: number;
  totalOffers?: number;
}

interface LoadAllProgress {
  offersLoaded: number;
  pagesLoaded: number;
}

interface StatusMessageProps {
  result: SortResult | null;
  progress: ProgressUpdate | null;
  isLoading: boolean;
  loadAllProgress?: LoadAllProgress | null;
  isLoadingAll?: boolean;
  showFavoritesOnly?: boolean;
}

export const StatusMessage = ({
  result,
  progress,
  isLoading,
  loadAllProgress,
  isLoadingAll,
  showFavoritesOnly
}: StatusMessageProps) => {
  if (isLoadingAll && loadAllProgress) {
    return (
      <div className="status-message progress">
        {loadAllProgress.offersLoaded} loaded so far
        {loadAllProgress.pagesLoaded > 0 && ` (page ${loadAllProgress.pagesLoaded})`}
      </div>
    );
  }

  if (isLoading && progress && progress.type === "pagination") {
    return (
      <div className="status-message progress">
        Loading... {progress.offersLoaded} offers
        {progress.pagesLoaded && progress.pagesLoaded > 0 && ` (page ${progress.pagesLoaded})`}
      </div>
    );
  }

  if (showFavoritesOnly && !isLoading && !isLoadingAll) {
    return (
      <div className="status-message success">
        Showing favorited offers
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className={`status-message ${result.success ? "success" : "error"}`}>
      {result.success ? (
        <div>
          Sorted {result.tilesProcessed} offers
          {result.pagesLoaded > 0 && ` (loaded ${result.pagesLoaded} pages)`}
        </div>
      ) : (
        <div>
          {result.error || "Sort failed"}
        </div>
      )}
    </div>
  );
};
