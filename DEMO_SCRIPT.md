# Demo Script (2-3 Minutes)

## Preparation
- Open: https://3000-i85dutnmawkf4y3pkz4ol-2e77fc33.sandbox.novita.ai
- Have example_upload.json ready

## Script

### 1. Select Category (10 seconds)
**Action**: Click the dropdown and select "Smartphones"

**Expected**: 
- Criteria appear: Battery, CPU/GPU Perf, Refresh Rate, Camera, Weight, Price
- Weight sliders show default "Student" preset

### 2. Search & Add Products (30 seconds)
**Action**: 
- Type "Pixel" in search box
- Click "Add" on "Google Pixel 8"
- Type "Note" in search box
- Click "Add" on "Nothing Phone 2"
- Type "OnePlus" in search box
- Click "Add" on "OnePlus 12"

**Expected**: 
- Three products appear in "Selected Products" bar
- Each has an "✕" button to remove

### 3. Adjust Weights (20 seconds)
**Action**:
- Click "Gamer" preset button
- Move "Battery" slider from 20 to 25
- Move "Price" slider from 5 to 0

**Expected**:
- Weight total updates in real-time
- Auto-balances to exactly 100
- Shows green if valid, red if not

### 4. Compare (5 seconds)
**Action**: Click "Compare Products" button

**Expected**: 
- Comparison results section appears
- Winner explanation shows at top
- Comparison table with 3 columns (one per product)

### 5. Review Results (40 seconds)

**Winner Explanation**:
```
Winner: OnePlus 12
Why it wins:
- CPU/GPU Perf: Strong contribution (36.8%)
- Battery: Strong contribution (23.5%)
- Refresh Rate: Strong contribution (10.0%)

Weak point:
- Weight: Low contribution (0.0%)
```

**Comparison Table**:
- Headers show rank, brand, model, total score
- Best values per row highlighted in green
- Hover any cell to see tooltip

**Hover Demo** (on Battery for OnePlus 12):
```
Raw: 5400 mAh
Normalized: 1.000
Weight: 25.0%
Contribution: 25.0%
```

### 6. Export (10 seconds)
**Action**: Click "Export as CSV"

**Expected**: 
- CSV file downloads
- Open in Excel/Sheets
- Verify numbers match on-screen

### 7. Upload Demo (Optional, 15 seconds)
**Action**:
- Click "Upload Products (JSON)"
- Select `example_upload.json`

**Expected**:
- Alert: "Successfully added 2 products"
- New products available in search

## Key Points to Highlight

1. **Transparent Math**: Every number is explainable via tooltips
2. **Auto-balancing**: Weights always sum to 100
3. **Smart Ranking**: Tie-breaks by price → year → brand
4. **Flexible Presets**: Quickly switch between user personas
5. **Data Validation**: Upload shows clear errors for bad data

## Expected Results for Demo

**With Gamer Preset (Battery 25%, CPU 40%, Refresh 25%)**:

| Rank | Product | Score |
|------|---------|-------|
| 1 | OnePlus 12 | 85.2% |
| 2 | Google Pixel 8 | 71.3% |
| 3 | Nothing Phone 2 | 65.1% |

**Winner Analysis**:
- OnePlus 12 wins due to best battery (5400 mAh) and strong CPU (920 score)
- Has highest refresh rate (120 Hz)
- Only weakness: heaviest weight (220g) but weight only 5% importance

## Troubleshooting

**Issue**: Sliders won't move
- **Fix**: Ensure category is selected first

**Issue**: Compare button disabled
- **Fix**: Add at least 2 products and ensure weights sum to 100

**Issue**: No products in search
- **Fix**: Check category is selected

**Issue**: Upload fails
- **Fix**: Ensure JSON format matches schema (see example_upload.json)

## Questions to Ask Audience

1. "How would you adjust weights for your use case?"
2. "What other categories would be useful?"
3. "Should we add a maximum price filter?"
4. "Would you like to see a side-by-side photo comparison?"

---

**Demo Time**: 2-3 minutes
**Preparation**: < 1 minute
**Difficulty**: Easy (no technical knowledge required)
