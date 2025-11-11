# Testing Guide - Refactored Extension

## Current Status

✅ TypeScript compiles with 0 errors
✅ All modules refactored
⚠️ Need to test in browser

## Known Issues Fixed

### 1. Favorites Persistence
**Issue:** Favorites state was being cleared on every page load
**Fix:** Modified `src/content/index.ts` to preserve `c1-favorites-enabled` state
**Result:** Favorites now persist across page reloads

### 2. Auto-Enable Favorites
**Issue:** Favorites weren't auto-injecting on page load
**Fix:** Added auto-enable logic to check storage and inject stars if previously enabled
**Location:** `src/content/index.ts` lines 82-94

## Testing Steps

### 1. Build Extension
```bash
yarn build
```

### 2. Load in Chrome
1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/` folder
5. Navigate to a Capital One offers page

### 3. Test Favorites

**First Time Setup:**
1. Open extension popup
2. Toggle "Favorites" ON
3. Look for star buttons on offers (top-right corner of each tile)
4. Click a few stars to favorite some offers
5. Reload the page
6. **Expected:** Stars should automatically reappear (auto-enabled)

**If stars don't appear:**
- Open DevTools Console
- Look for: `[Content] Auto-enabling favorites (was previously enabled)`
- Check for any errors

### 4. Test Table View

**Enable Table View:**
1. Toggle "Table View" ON in popup
2. **Expected:** Offers display in a table format
3. **Expected:** Table has columns: Merchant, Mileage, Action, ★ (if favorites enabled)
4. **Expected:** Pagination controls at bottom

**Critical Test - Click Handling:**
1. Click anywhere on a table row
2. **Expected:** Capital One's offer modal should open
3. **This tests the invisible overlay workaround**

**If table looks bad:**
- Check if table has proper styling (dark background, white text)
- Check if columns are aligned
- Check DevTools Console for errors

### 5. Test Sorting

1. Select sort criteria (Mileage or Merchant)
2. Select sort order (Highest/Lowest or A-Z/Z-A)
3. Click "Sort Offers"
4. **Expected:** Offers reorder based on selection
5. **Expected:** Works in both grid and table view

### 6. Test Favorites Filter

**Prerequisites:** Must have favorites enabled and some offers favorited

1. Toggle "Show Favorites Only" ON
2. **Expected:** Only favorited offers show
3. **Expected:** Works in both grid and table view
4. Toggle OFF
5. **Expected:** All offers show again

## Debugging

### Check Console Logs

**On page load, you should see:**
```
[Content] Initializing C1 Offers Sorter (REFACTORED)...
[Content] ✅ Valid Capital One offers page
[Content] Setting up message handler...
[Content] Initializing favorites...
[FavoritesOrchestrator] Favorites watcher initialized
[Content] Auto-enabling favorites (was previously enabled)  // if favorites were on
[Content] Initialization complete ✅
```

### Common Issues

**Issue:** Stars don't appear
**Solution:**
1. Check if favorites are enabled in storage
2. Run in console: `chrome.storage.local.get('c1-favorites-enabled')`
3. Should show `{c1-favorites-enabled: true}`

**Issue:** Table view doesn't work
**Solution:**
1. Check console for errors
2. Verify table container exists: `document.getElementById('c1-offers-table-container')`
3. Check if tiles have invisible overlay styles

**Issue:** Clicks don't work in table view
**Solution:**
1. Check if tiles are positioned absolutely
2. Check z-index (should be 5)
3. Check opacity (should be 0)
4. Check pointer-events (should be 'auto')

## Manual Verification Checklist

- [ ] Extension loads without errors
- [ ] Popup UI displays correctly
- [ ] Favorites toggle works
- [ ] Stars appear on offers
- [ ] Stars persist across page reloads
- [ ] Can favorite/unfavorite offers
- [ ] Table view toggle works
- [ ] Table displays correctly
- [ ] Can click offers in table view (modal opens)
- [ ] Sorting works in grid view
- [ ] Sorting works in table view
- [ ] Favorites filter works
- [ ] Pagination works in table view
- [ ] Stars work in table view

## Next Steps

If all tests pass:
1. Test on different Capital One pages (/feed, /c1-offers)
2. Test with many offers (pagination)
3. Test switching between modes rapidly
4. Test with slow network (page loading)

If tests fail:
1. Note which specific test failed
2. Check console logs
3. Check Chrome DevTools for errors
4. Report specific error messages
