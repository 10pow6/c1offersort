import React, { useState, useCallback, useEffect } from "react";
import { Coffee } from "lucide-react";

const VALID_URL = "https://capitaloneoffers.com/c1-offers";
const COFFEE_URL = "https://buymeacoffee.com/noritheshiba";

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc"); // default to "desc"

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        setCurrentUrl(tabs[0].url);
      }
    });
  }, []);

  /**
   * 1) Small script to check if "View More Offers" button is present.
   *    Returns true if it exists (meaning we do need to load more).
   */
  function checkNeedsLoading() {
    const btn = Array.from(document.querySelectorAll("button")).find(
      (button) => button.textContent === "View More Offers"
    );
    return !!btn; // true if found, false otherwise
  }

  /**
   * 2) Main script that does the sorting (and loads offers as needed).
   *    We pass in a boolean telling it to sort descending or ascending.
   */
  async function injectedScript(isDescending: boolean) {
    function parseMileageValue(text: string): number {
      const cleanedText = text.replace(/\*/g, "").trim();

      // Handle "2X miles" format
      const multiplierMatch = cleanedText.match(/(\d+)X miles/i);
      if (multiplierMatch) {
        return parseInt(multiplierMatch[1], 10) * 1000;
      }

      // Handle normal numeric miles (e.g., "Up to 60,000 miles")
      const milesMatch = cleanedText.match(/(?:Up to )?([0-9,]+) miles/i);
      if (milesMatch) {
        return parseInt(milesMatch[1].replace(/,/g, ""), 10);
      }

      return 0;
    }

    async function loadAllTiles() {
      let attempts = 0;
      const maxAttempts = 20;

      while (true) {
        const viewMoreButton = Array.from(
          document.querySelectorAll("button")
        ).find((button) => button.textContent === "View More Offers");

        if (!viewMoreButton) break;

        viewMoreButton.click();
        await new Promise((resolve) => setTimeout(resolve, 500));

        attempts++;
        if (attempts >= maxAttempts) break;
      }
    }

    async function sortByMiles() {
      const mainContainer = document.querySelector(
        ".grid.justify-center.gap-4.h-full.w-full"
      ) as HTMLElement | null;
      if (!mainContainer) return;

      // Hide carousel
      const carouselElement = document.querySelector(
        '.app-page[style*="grid-column"]'
      ) as HTMLElement | null;
      if (carouselElement) {
        carouselElement.style.display = "none";
      }

      // Load all tiles (if any)
      await loadAllTiles();

      // Force the container to use a grid so we can reorder via CSS 'order'
      mainContainer.style.display = "grid";

      // Gather tile elements
      const allTiles = [
        ...mainContainer.querySelectorAll(".standard-tile"),
        ...mainContainer.querySelectorAll(
          'div.flex > div[style*="border-radius"][style*="background-color"]'
        ),
      ];

      // Calculate mileage for each tile
      const tilesWithMiles = allTiles.map((tile) => {
        const parent = tile.parentElement as HTMLElement | null;
        const mileageDiv =
          tile.querySelector('div[style*="color"]') ||
          tile.querySelector(
            'div[style*="background-color: rgb(37, 129, 14)"]'
          );

        const mileageText = mileageDiv?.textContent || "0 miles";
        const mileageValue = parseMileageValue(mileageText);

        return { element: parent, mileage: mileageValue };
      });

      // Sort ascending or descending based on user selection
      tilesWithMiles
        .sort((a, b) =>
          isDescending ? b.mileage - a.mileage : a.mileage - b.mileage
        )
        .forEach((item, index) => {
          if (item.element) {
            item.element.style.order = String(index);
          }
        });
    }

    await sortByMiles();
    return true;
  }

  /**
   * Sort button handler
   */
  const handleSort = useCallback(async () => {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!activeTab?.id) return;

    // 1) Check if we need to load more offers
    //    If not, we can avoid showing the "Loading..." text altogether.
    const [checkResults] = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: checkNeedsLoading,
    });

    const needsLoading = checkResults.result === true;

    // 2) Only show the "Loading offers..." message if needed
    if (needsLoading) {
      setIsLoading(true);
    }

    try {
      // 3) Actually execute the sorting script (loads if needed).
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: injectedScript,
        args: [sortOrder === "desc"],
      });
    } catch (error) {
      console.error("Error executing the script:", error);
    } finally {
      // 4) End loading state (if it was set)
      if (needsLoading) {
        setIsLoading(false);
      }
    }
  }, [sortOrder]);

  /**
   * Radio button change handler
   */
  const handleSortOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSortOrder(e.target.value as "desc" | "asc");
  };

  const isValidUrl = currentUrl.startsWith(VALID_URL);

  // ---------------------------------------------
  // UI Render
  // ---------------------------------------------
  return (
    <div
      className="App"
      style={{
        backgroundColor: "#013d5b",
        minHeight: "100vh",
        color: "white",
        padding: "0 16px",
        position: "relative",
      }}
    >
      <h1
        className="text-xl font-bold"
        style={{ margin: 0, paddingTop: "16px" }}
      >
        C1 Offers Sorter
      </h1>

      {/* Container that spaces out the radio buttons, button, and loading message evenly */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          marginTop: "24px",
        }}
      >
        {/* Sort Order Selection */}
        <div
          className="sort-order-selector"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "0.9rem",
          }}
        >
          <div>Sort by:</div>
          <label>
            <input
              type="radio"
              name="sortOrder"
              value="desc"
              checked={sortOrder === "desc"}
              onChange={handleSortOrderChange}
            />
            <span style={{ marginLeft: "4px" }}>Highest Miles</span>
          </label>
          <label>
            <input
              type="radio"
              name="sortOrder"
              value="asc"
              checked={sortOrder === "asc"}
              onChange={handleSortOrderChange}
            />
            <span style={{ marginLeft: "4px" }}>Lowest Miles</span>
          </label>
        </div>

        {/* Sort Button - same size whether loading or not, moved down with extra margin */}
        <button
          onClick={handleSort}
          disabled={isLoading || !isValidUrl}
          style={{
            backgroundColor: "#25810E",
            color: "#ffffff",
            borderRadius: "6px",
            fontWeight: "500",
            cursor: isLoading || !isValidUrl ? "not-allowed" : "pointer",
            opacity: isLoading || !isValidUrl ? 0.7 : 1,
            minHeight: "40px",
            minWidth: "120px",
            padding: "0 16px",
            border: "none",
            transition: "transform 0.1s ease",
          }}
          onMouseDown={(e) => {
            if (!isLoading && isValidUrl) {
              e.currentTarget.style.transform = "scale(0.95)";
            }
          }}
          onMouseUp={(e) => {
            if (!isLoading && isValidUrl) {
              e.currentTarget.style.transform = "scale(1)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading && isValidUrl) {
              e.currentTarget.style.transform = "scale(1)";
            }
          }}
        >
          {isLoading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <div className="spinner" />
              <span>Loading...</span>
            </div>
          ) : (
            "Sort Offers"
          )}
        </button>

        {/* Buy Me a Coffee Button */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "8px",
          }}
        >
          <a
            href={COFFEE_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              backgroundColor: "#FFDD00",
              color: "#000000",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "0.75rem",
              textDecoration: "none",
              fontWeight: "500",
              opacity: 0.9,
            }}
          >
            <Coffee size={12} />
            <span>Buy me a coffee</span>
          </a>
        </div>
      </div>

      {/* If not on the valid URL, show overlay */}
      {!isValidUrl && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="48"
            height="48"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginBottom: "16px" }}
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div
            style={{ fontSize: "16px", fontWeight: "500", marginBottom: "8px" }}
          >
            Invalid Page
          </div>
          <div style={{ fontSize: "14px", opacity: 0.8 }}>
            This extension only works on the Capital One Offers page.
          </div>
          <button
            onClick={() => window.open(VALID_URL, "_blank")}
            style={{
              marginTop: "16px",
              padding: "8px 16px",
              backgroundColor: "#25810E",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Go to Offers Page
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
