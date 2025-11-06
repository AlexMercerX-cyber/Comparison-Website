# Product Comparison Tool

A web application that helps users compare products using weighted criteria and transparent scoring methodology.

## 🚀 Project Overview

**Purpose**: Help users make informed purchase decisions by comparing 3-5 products based on customizable criteria weights.

**Categories**: 
- Smartphones
- Laptops

**Key Features**:
- ✅ Category-based product comparison
- ✅ Customizable weight sliders (must sum to 100)
- ✅ Normalized scoring with min-max normalization
- ✅ Transparent score breakdown (tooltips show raw/norm/contribution)
- ✅ Intelligent tie-breaking (score → price → year → brand)
- ✅ Winner explanation panel
- ✅ Product search and selection (3-5 products)
- ✅ CSV/JSON data upload with validation
- ✅ CSV export functionality
- ✅ Preset weight profiles (Student, Gamer, Traveler, Editor)

## 🌐 URLs

**Sandbox**: https://3000-i85dutnmawkf4y3pkz4ol-2e77fc33.sandbox.novita.ai

**API Endpoints**:
- `GET /api/categories` - List all categories
- `GET /api/categories/:id/criteria` - Get criteria for category
- `GET /api/products?categoryId=X&query=Y` - Search products
- `POST /api/compare` - Compare products with weights
- `POST /api/upload` - Upload product data (JSON)

## 📊 Data Architecture

**Categories** (`src/data/categories.json`):
- `id`, `name`, `criteria[]`, `presets{}`
- Criteria define: key, label, type, goal (max/min), unit

**Products** (`src/data/products.json`):
- 12 smartphones (brands: Samsung, Apple, Google, OnePlus, Xiaomi, Vivo, Nothing, Realme, Motorola, Oppo)
- 12 laptops (brands: Apple, Dell, HP, Lenovo, Asus, Microsoft, Acer, MSI, Razer, LG, Samsung, Huawei)
- Fields: id, categoryId, brand, model, specs{}, releaseYear

**Storage**: In-memory arrays (production could use Cloudflare D1)

## 🧮 Scoring Algorithm

1. **Normalization** (per criterion):
   - If max == min: norm = 0.5 (all equal)
   - Else: norm = (value - min) / (max - min)
   - If goal is "min": norm = 1 - norm (invert)

2. **Weight Application**:
   - Weights sum to 100 (slider values)
   - Normalized to 0-1 range: weight_i / 100
   - Contribution = norm × weight

3. **Total Score**:
   - Total = Σ(contribution_i)
   - Range: 0.0 to 1.0

4. **Tie-Breaking**:
   - Higher total score wins
   - If equal: lower price wins
   - If equal: newer release year wins
   - If equal: brand alphabetical order

## 📖 User Guide

### Quick Start (2-minute demo):

1. **Select Category**: Choose "Smartphones" or "Laptops"
2. **Add Products**: 
   - Search for products (e.g., "Pixel", "MacBook")
   - Click "Add" to select 3-5 products
   - Click "✕" to remove unwanted products
3. **Adjust Weights**: 
   - Use sliders to set importance (must sum to 100)
   - Click preset buttons: "Student", "Gamer", "Traveler", "Editor"
   - Click "Reset" to restore defaults
4. **Compare**: Click "Compare Products" button
5. **Review Results**:
   - See winner explanation ("Why it wins")
   - Check comparison table with highlights
   - Hover cells for detailed math breakdown
6. **Export**: Click "Export as CSV" to download results

### Advanced Features:

**Upload Custom Data**:
- Prepare JSON file following product schema
- Click "Upload Products" and select file
- Validation errors will be displayed if any

**Score Tooltips**:
- Hover over any cell in comparison table
- See: Raw value, Normalized score, Weight %, Contribution %

**Best Value Highlighting**:
- Green cells indicate best value per criterion
- "Max" goal: highest value wins
- "Min" goal: lowest value wins

## 🛠️ Tech Stack

- **Backend**: Hono (edge framework)
- **Frontend**: React 18 (via CDN)
- **Styling**: TailwindCSS
- **Icons**: FontAwesome
- **Deployment**: Cloudflare Pages
- **Runtime**: Cloudflare Workers

## 🚀 Development

### Setup
```bash
npm install
```

### Build
```bash
npm run build
```

### Run Locally (Sandbox)
```bash
# Clean port first
npm run clean-port

# Start with PM2
pm2 start ecosystem.config.cjs

# Check logs
pm2 logs webapp --nostream

# Test
curl http://localhost:3000/api/categories
```

### Deploy to Cloudflare Pages
```bash
npm run deploy:prod
```

## 📋 Functional Requirements Status

| ID | Requirement | Status |
|----|-------------|--------|
| F1 | Category selection | ✅ Complete |
| F2 | Product search and add | ✅ Complete |
| F3 | Custom weights with sliders | ✅ Complete |
| F4 | Normalized scoring | ✅ Complete |
| F5 | Comparison table with highlights | ✅ Complete |
| F6 | Explanation panel | ✅ Complete |
| F7 | Data import (JSON) | ✅ Complete |
| F8 | Export results (CSV) | ✅ Complete |
| F9 | Save/load comparisons | ⏳ Future (needs D1) |

## 🧪 Test Cases

✅ **Weight sum validation**: Sliders auto-balance to 100
✅ **All-equal criterion**: Sets norm = 0.5 for all products
✅ **Min-goal inversion**: Lower price increases score when price has high weight
✅ **Tie-break order**: Lower price, then newer year, then brand A→Z
✅ **Bad upload**: Shows validation errors for missing fields
✅ **Export integrity**: CSV matches on-screen values

## 📝 Data Schema Examples

### Category Criteria
```json
{
  "id": "phone",
  "name": "Smartphones",
  "criteria": [
    {"key": "battery_mAh", "label": "Battery", "type": "number", "goal": "max", "unit": "mAh"}
  ],
  "presets": {
    "Student": {"battery_mAh": 30, "soc_score": 25, ...}
  }
}
```

### Product
```json
{
  "id": "ph1",
  "categoryId": "phone",
  "brand": "Samsung",
  "model": "Galaxy S24",
  "specs": {
    "battery_mAh": 4000,
    "soc_score": 950,
    "price_inr": 79999
  },
  "releaseYear": 2024
}
```

## 🎯 Recommended Next Steps

1. **Add Cloudflare D1 storage** for persistent saved comparisons (F9)
2. **Implement PDF export** using client-side jsPDF library
3. **Add radar charts** using Recharts for visual comparison
4. **CSV upload parsing** using PapaParse library
5. **User authentication** for saving/loading personal comparisons
6. **Real-time pricing** integration via external APIs
7. **More categories**: Cameras, TVs, Headphones, etc.
8. **Advanced filtering**: Price range, brand filters, release year
9. **Mobile responsive design** improvements
10. **Share comparison link** with URL parameters

## 🔒 Validation Rules

- Numbers only for numeric criteria
- No negative values allowed
- Release year: 2018-present for demo data
- Required keys must exist for selected category
- Category ID must match available categories
- Minimum 2 products, maximum 5 products for comparison
- Weights must sum to exactly 100

## 📄 License

MIT License - Feel free to use and modify.

## 🤝 Contributing

This is a demo project. To extend:
1. Add new categories in `src/data/categories.json`
2. Add products in `src/data/products.json`
3. No code changes needed for new criteria - config-only!

---

**Last Updated**: 2025-11-06
**Status**: ✅ Active and Deployed
**Platform**: Cloudflare Pages
