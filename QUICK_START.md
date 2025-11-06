# Quick Start Guide

## 🚀 Access the App

**Live URL**: https://3000-i85dutnmawkf4y3pkz4ol-2e77fc33.sandbox.novita.ai

## 🎯 2-Minute Workflow

### Step 1: Select Category (5 seconds)
1. Open the app
2. Click the dropdown at the top
3. Select **"Smartphones"**

### Step 2: Add Products (30 seconds)
1. Type **"Pixel"** in the search box
2. Click **"Add"** on "Google Pixel 8"
3. Type **"OnePlus"** in the search box  
4. Click **"Add"** on "OnePlus 12"
5. Type **"Nothing"** in the search box
6. Click **"Add"** on "Nothing Phone 2"

You should see 3 products in the "Selected Products" bar.

### Step 3: Choose a Preset (5 seconds)
Click the **"Gamer"** button to apply the Gamer weight preset:
- Battery: 20%
- CPU/GPU Perf: 40%
- Refresh Rate: 25%
- Camera: 5%
- Weight: 5%
- Price: 5%

### Step 4: Compare (5 seconds)
Click the green **"Compare Products"** button at the bottom.

### Step 5: View Results (60 seconds)

**Winner Section** (at top):
```
Winner: OnePlus 12

Why it wins:
• CPU/GPU Perf: Strong contribution (40.0%)
• Battery: Strong contribution (25.0%)
• Refresh Rate: Strong contribution (12.5%)

Weak point:
• Weight: Low contribution (0.0%)
```

**Comparison Table** (below):
- 3 columns (one per product)
- Rows for each criterion
- Green highlights = best value
- Hover any cell to see math breakdown

**Try This**: Hover over the Battery cell for OnePlus 12:
```
Raw: 5400 mAh
Normalized: 1.000
Weight: 20.0%
Contribution: 20.0%
```

### Step 6: Export (5 seconds)
Click **"Export as CSV"** to download the comparison data.

## 🎮 Try Different Scenarios

### Scenario A: Budget Student
1. Select **Smartphones**
2. Add: Samsung Galaxy A54, Motorola Edge 40, Oppo Reno 11
3. Click **"Student"** preset
4. Compare

**Expected Winner**: Depends on battery and price balance

### Scenario B: Professional Laptop
1. Select **Laptops**
2. Add: MacBook Air M2, Dell XPS 13, Lenovo ThinkPad X1
3. Click **"Editor"** preset (RAM 30%, CPU 35%)
4. Compare

**Expected Winner**: MSI Prestige 14 (32GB RAM, 2500 CPU score)

### Scenario C: Custom Weights
1. Select **Smartphones**
2. Add any 3-5 phones
3. Adjust sliders manually:
   - Battery: 40%
   - Price: 40%
   - Others: 20% total
4. Compare

**Expected Winner**: Best battery-to-price ratio

## 🧪 Test Advanced Features

### Upload Custom Products
1. Download: [example_upload.json](./example_upload.json)
2. Click **"Upload Products (JSON)"**
3. Select the file
4. See: "Successfully added 2 products"
5. Search for "Sony" or "Asus ROG" to find new products

### Test Validation
1. Create a file with missing specs
2. Try to upload
3. See clear error message: "Missing specs: display_refresh, camera_mp..."

## 📊 Understanding the Scores

### Score Calculation Example

**Product**: OnePlus 12
**Weights**: Battery 25%, CPU 40%, Refresh 25%, Others 10%

```
Battery:
  Raw: 5400 mAh (highest among selected)
  Normalized: 1.0 (max value)
  Contribution: 1.0 × 0.25 = 0.25

CPU:
  Raw: 920 (highest among selected)
  Normalized: 1.0 (max value)
  Contribution: 1.0 × 0.40 = 0.40

Refresh Rate:
  Raw: 120 Hz (tied with others)
  Normalized: 0.5 (mid value)
  Contribution: 0.5 × 0.25 = 0.125

Total Score: 0.25 + 0.40 + 0.125 + ... = 0.775 (77.5%)
```

### Tie-Breaking

If two products have the same total score:
1. **Lower price wins** (₹44,999 beats ₹64,999)
2. **Newer year wins** (2024 beats 2023)
3. **Brand alphabetical** (Apple beats Samsung)

## 🔍 Pro Tips

1. **Weight Sum Must Equal 100**: The app auto-balances sliders
2. **Green = Best**: Look for green cells in the comparison table
3. **Hover for Details**: Every cell shows raw/norm/contribution
4. **Use Presets**: Quickly switch between user personas
5. **Export Data**: Download CSV to analyze in Excel/Sheets

## ❓ Troubleshooting

**Q: Compare button is disabled**
- A: Need at least 2 products selected and weights sum to 100

**Q: No products appear in search**
- A: Ensure category is selected first

**Q: Upload fails**
- A: Check JSON format matches example_upload.json schema

**Q: Scores seem wrong**
- A: Hover cells to see math - might be normalized/inverted for "min" goals

## 📞 Support

For issues or questions:
- Check README.md for detailed documentation
- Review DEMO_SCRIPT.md for step-by-step guidance
- See PROJECT_SUMMARY.md for technical details

---

**Estimated Time**: 2 minutes for basic comparison
**Difficulty**: Easy (no technical knowledge required)
**Best For**: Quick product decisions with transparent scoring
