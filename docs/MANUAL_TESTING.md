# Manual Testing Guide - C1 Offers Sorter Extension

## Quick Smoke Test (10-15 minutes)

This guide covers critical functionality that should work before any release. Focus on the happy path - what users actually do in normal usage.

**When to run these tests:**
- Before creating a pull request
- Before releasing a new version
- After Capital One updates their offers page

---

## Setup (2 minutes)

1. **Build and load extension:**
   ```bash
   yarn install
   yarn build
   ```

2. **Load in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" → select `dist/` folder
   - Verify no errors appear

3. **Navigate to test page:**
   - Log in to Capital One
   - Go to: `https://capitaloneoffers.com/feed`

4. **Optional - Clear favorites:**
   - Right-click extension icon → "Inspect popup"
   - In console: `chrome.storage.local.clear()`

---

## Core Functionality Tests

### 1. URL Validation (2 tests)

#### ✅ Test 1.1: Extension works on valid page
**Steps:**
1. Navigate to `https://capitaloneoffers.com/feed`
2. Click extension icon

**Pass:** No overlay, sort controls enabled
**Fail:** Shows "Invalid Page" overlay

#### ✅ Test 1.2: Extension blocks invalid page
**Steps:**
1. Navigate to `https://www.google.com`
2. Click extension icon

**Pass:** Dark overlay with message "This extension only works on the Capital One Shopping Offers page"
**Fail:** No overlay, controls appear active

---

### 2. Basic Sorting (3 tests)

#### ✅ Test 2.1: Sort descending (highest first)
**Steps:**
1. On offers page, note current order
2. Open popup, ensure "Highest first" selected
3. Click "Sort Offers"

**Pass:**
- Button shows "Sorting..." with spinner
- Offers reorder with highest mileage at top
- Success message: "Sorted X tiles across Y pages"

**Fail:** Offers don't reorder, or error message appears

#### ✅ Test 2.2: Sort ascending (lowest first)
**Steps:**
1. Select "Lowest first" radio button
2. Click "Sort Offers"

**Pass:** Offers reorder with lowest mileage at top
**Fail:** Wrong order or no change

#### ✅ Test 2.3: Sort twice (verify re-sorting works)
**Steps:**
1. Sort descending
2. Switch to ascending
3. Click "Sort Offers" again

**Pass:** Order reverses correctly, no duplicated tiles
**Fail:** Tiles disappear, duplicate, or order doesn't change

---

### 3. Pagination Handling (2 tests)

#### ✅ Test 3.1: Automatically load all pages
**Steps:**
1. On offers page, check if "View More Offers" button exists at bottom
2. Count visible offers (if easy to count)
3. Click "Sort Offers"
4. Observe page (don't scroll)

**Pass:**
- "View More Offers" button clicks automatically
- Success message shows pages > 1: "Sorted X tiles across Y pages"
- All offers from all pages are sorted

**Fail:** Only first page sorted, button still visible

#### ✅ Test 3.2: Works when all offers already loaded
**Steps:**
1. Manually click "View More Offers" until button disappears
2. Click "Sort Offers"

**Pass:** Sort completes, message shows "1 page"
**Fail:** Error about missing button

---

### 4. Mileage Parsing (3 tests)

#### ✅ Test 4.1: Multiplier format (2X, 5X)
**Steps:**
1. Find offers with "2X miles", "5X miles", etc.
2. Sort descending
3. Verify multipliers sort correctly

**Pass:** 5X sorts above 2X, multipliers appear near top
**Fail:** Multipliers sort incorrectly or as zero

#### ✅ Test 4.2: Static points (60,000 miles)
**Steps:**
1. Find offers with specific amounts (e.g., "60,000 miles")
2. Sort descending

**Pass:** High values (60,000) sort above low values (1,700)
**Fail:** Commas interfere with sorting

#### ✅ Test 4.3: "Up to X miles" format
**Steps:**
1. Find offers with "Up to 60,000 miles"
2. Sort descending

**Pass:** Sorts by numeric value (60,000)
**Fail:** Parsed as 0 or sorts incorrectly

---

### 5. Favorites Management (5 tests)

#### ✅ Test 5.1: Add to favorites
**Steps:**
1. Click "Manage Favorites" button in popup
2. Click an offer tile on page

**Pass:**
- Yellow star appears on offer
- Status message: "Added to favorites"

**Fail:** No star or no message

#### ✅ Test 5.2: Remove from favorites
**Steps:**
1. Click "Manage Favorites"
2. Click a favorited offer (with star)

**Pass:**
- Star disappears
- Status message: "Removed from favorites"

**Fail:** Star remains

#### ✅ Test 5.3: Favorites persist after page reload
**Steps:**
1. Add 3-5 offers to favorites
2. Note merchant names
3. Reload page (F5)

**Pass:** Stars reappear on same offers
**Fail:** Stars gone or on different offers

#### ✅ Test 5.4: Exit favorites mode
**Steps:**
1. Click "Manage Favorites"
2. Click "Exit Favorites Mode"

**Pass:**
- Status message disappears
- Clicking offers no longer toggles favorites
- Stars remain visible on favorited offers

**Fail:** Can still toggle favorites after exit

#### ✅ Test 5.5: Favorites persist after extension reload
**Steps:**
1. Add several offers to favorites
2. Go to `chrome://extensions/`, reload extension
3. Refresh offers page

**Pass:** All favorites still marked with stars
**Fail:** Favorites lost

---

### 6. Favorites Filtering (3 tests)

#### ✅ Test 6.1: Show only favorites
**Steps:**
1. Add 3-5 offers to favorites
2. Click "Show Favorites Only" button

**Pass:**
- Only favorited offers visible
- Status message: "Showing X favorites"
- Button text changes to "Show All Offers"

**Fail:** All offers still visible

#### ✅ Test 6.2: Show all offers (clear filter)
**Steps:**
1. Enable favorites filter
2. Click "Show All Offers"

**Pass:**
- All offers visible again
- Favorite stars remain

**Fail:** Offers stay hidden

#### ✅ Test 6.3: Filter then sort
**Steps:**
1. Add 5+ offers to favorites
2. Enable favorites filter
3. Sort descending

**Pass:**
- Only favorited offers are sorted
- Hidden offers remain hidden

**Fail:** Filter clears or sorting fails

---

### 7. Error Handling (2 tests)

#### ✅ Test 7.1: Multiple rapid clicks ignored
**Steps:**
1. Open popup
2. Rapidly click "Sort Offers" 5-10 times

**Pass:**
- Only one sort operation runs
- Button disabled during sort
- No console errors

**Fail:** Multiple sorts run, tiles duplicate/disappear

#### ✅ Test 7.2: Console is clean
**Steps:**
1. Open DevTools console
2. Perform various operations (sort, favorites, filter)

**Pass:** No errors or excessive warnings
**Fail:** Console flooded with errors/warnings

---

## Quick Pass/Fail Checklist

Before release, verify all these pass:

- [ ] 1.1: Works on valid page
- [ ] 1.2: Blocks invalid page
- [ ] 2.1: Sort descending
- [ ] 2.2: Sort ascending
- [ ] 2.3: Re-sort works
- [ ] 3.1: Pagination loads all pages
- [ ] 3.2: Works without pagination
- [ ] 4.1: Multiplier parsing (2X, 5X)
- [ ] 4.2: Static points parsing (60,000)
- [ ] 4.3: "Up to X" parsing
- [ ] 5.1: Add to favorites
- [ ] 5.2: Remove from favorites
- [ ] 5.3: Favorites persist (reload)
- [ ] 5.4: Exit favorites mode
- [ ] 5.5: Favorites persist (extension reload)
- [ ] 6.1: Filter to favorites only
- [ ] 6.2: Clear filter
- [ ] 6.3: Filter then sort
- [ ] 7.1: Rapid clicks handled
- [ ] 7.2: Console clean

**Total: 20 critical tests**

---

## When Tests Fail

### Capital One changed their page structure
- Multiple sorting/favorites tests fail
- Check selectors in `src/services/chromeApi.ts`
- Update resilient selectors

### Storage issues
- Favorites don't persist
- Clear storage: `chrome.storage.local.clear()`
- Check DevTools → Application → Extension Storage

### Timing issues
- Pagination fails intermittently
- Check MutationObserver logic in sorting code

---

## Bug Report Template

If you find issues, report with:

1. Test number that failed (e.g., "Test 2.1 failed")
2. Steps to reproduce
3. Expected vs actual result
4. Chrome version (`chrome://version/`)
5. Console errors (screenshot)

---

## Advanced Testing (Optional)

For thorough testing, see additional test cases in git history (v1 of this file). These include:

- Accessibility (keyboard navigation, screen readers)
- Browser compatibility (Edge, Chrome Beta)
- Performance (100+ offers, zoom levels)
- Edge cases (network errors, missing elements)

**Current tests are sufficient for most releases. Only run advanced tests if:**
- Major refactor of core logic
- Accessibility complaints from users
- Performance issues reported
- Capital One major page redesign

---

**Last Updated:** 2025-01-01
**Document Version:** 2.0 (Simplified)
**Estimated Time:** 10-15 minutes
