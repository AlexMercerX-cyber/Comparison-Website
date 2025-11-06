import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import type {
  Category,
  Product,
  Weights,
  ComparisonResult,
} from './types';
import { calculateComparison, normalizeWeights } from './utils/scoring';
import categoriesData from './data/categories.json';
import productsData from './data/products.json';

const app = new Hono();

// Enable CORS for API routes
app.use('/api/*', cors());

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }));

// In-memory data storage (in production, use D1/KV)
let categories: Category[] = categoriesData as Category[];
let products: Product[] = productsData as Product[];

// API Routes

// GET /api/categories - Get all categories
app.get('/api/categories', (c) => {
  return c.json(
    categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
    }))
  );
});

// GET /api/categories/:id/criteria - Get criteria for a category
app.get('/api/categories/:id/criteria', (c) => {
  const id = c.req.param('id');
  const category = categories.find((cat) => cat.id === id);

  if (!category) {
    return c.json({ error: 'Category not found' }, 404);
  }

  return c.json(category);
});

// GET /api/products - Search products by category and query
app.get('/api/products', (c) => {
  const categoryId = c.req.query('categoryId');
  const query = c.req.query('query')?.toLowerCase() || '';

  let filtered = products.filter((p) => p.categoryId === categoryId);

  if (query) {
    filtered = filtered.filter(
      (p) =>
        p.brand.toLowerCase().includes(query) ||
        p.model.toLowerCase().includes(query)
    );
  }

  return c.json(filtered);
});

// POST /api/compare - Compare selected products
app.post('/api/compare', async (c) => {
  const body = await c.req.json();
  const { categoryId, productIds, weights } = body as {
    categoryId: string;
    productIds: string[];
    weights: { [key: string]: number };
  };

  // Validate input
  if (!categoryId || !productIds || productIds.length < 2) {
    return c.json(
      { error: 'Must provide categoryId and at least 2 productIds' },
      400
    );
  }

  const category = categories.find((cat) => cat.id === categoryId);
  if (!category) {
    return c.json({ error: 'Category not found' }, 404);
  }

  const selectedProducts = products.filter((p) =>
    productIds.includes(p.id)
  );

  if (selectedProducts.length < 2) {
    return c.json({ error: 'Not enough valid products found' }, 400);
  }

  // Normalize weights from 0-100 to 0-1
  const normalizedWeights: Weights = normalizeWeights(weights);

  // Calculate comparison
  const result: ComparisonResult = calculateComparison(
    selectedProducts,
    category.criteria,
    normalizedWeights
  );

  return c.json(result);
});

// POST /api/upload - Upload products CSV/JSON
app.post('/api/upload', async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('file') as File;
  const categoryId = formData.get('categoryId') as string;

  if (!file || !categoryId) {
    return c.json({ error: 'File and categoryId are required' }, 400);
  }

  const category = categories.find((cat) => cat.id === categoryId);
  if (!category) {
    return c.json({ error: 'Category not found' }, 404);
  }

  const text = await file.text();
  let newProducts: any[] = [];

  try {
    // Try parsing as JSON first
    if (file.name.endsWith('.json')) {
      newProducts = JSON.parse(text);
    } else {
      // CSV parsing would happen here (simplified for demo)
      return c.json(
        {
          error:
            'CSV upload not yet implemented. Please use JSON format.',
        },
        400
      );
    }
  } catch (error) {
    return c.json({ error: 'Invalid file format' }, 400);
  }

  // Validate products
  const errors: any[] = [];
  const validProducts: Product[] = [];
  const requiredKeys = category.criteria.map((cr) => cr.key);

  newProducts.forEach((prod, idx) => {
    // Check required fields
    if (!prod.brand || !prod.model || !prod.specs || !prod.releaseYear) {
      errors.push({
        row: idx + 1,
        field: 'general',
        message: 'Missing required fields: brand, model, specs, releaseYear',
      });
      return;
    }

    // Check category match
    if (prod.categoryId !== categoryId) {
      errors.push({
        row: idx + 1,
        field: 'categoryId',
        message: `Category mismatch: expected ${categoryId}`,
      });
      return;
    }

    // Check specs contain required criteria
    const missingKeys = requiredKeys.filter(
      (key) => !(key in prod.specs)
    );
    if (missingKeys.length > 0) {
      errors.push({
        row: idx + 1,
        field: 'specs',
        message: `Missing specs: ${missingKeys.join(', ')}`,
      });
      return;
    }

    // Validate year
    if (
      prod.releaseYear < 2018 ||
      prod.releaseYear > new Date().getFullYear() + 1
    ) {
      errors.push({
        row: idx + 1,
        field: 'releaseYear',
        message: 'Invalid release year',
      });
      return;
    }

    // Generate ID if missing
    if (!prod.id) {
      prod.id = `${categoryId}_${Date.now()}_${idx}`;
    }

    validProducts.push(prod);
  });

  // Add valid products to the list
  products.push(...validProducts);

  return c.json({
    added: validProducts.length,
    skipped: errors.length,
    errors,
  });
});

// Default route - Serve the React app
app.get('*', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Product Comparison Tool</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          .tooltip {
            position: relative;
            display: inline-block;
          }
          .tooltip .tooltiptext {
            visibility: hidden;
            width: 250px;
            background-color: #333;
            color: #fff;
            text-align: left;
            border-radius: 6px;
            padding: 10px;
            position: absolute;
            z-index: 1;
            bottom: 125%;
            left: 50%;
            margin-left: -125px;
            opacity: 0;
            transition: opacity 0.3s;
            font-size: 12px;
            line-height: 1.4;
          }
          .tooltip:hover .tooltiptext {
            visibility: visible;
            opacity: 1;
          }
          .slider-container {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
          }
          .slider {
            flex: 1;
          }
          .best-value {
            background-color: #d4edda !important;
            font-weight: bold;
          }
        </style>
    </head>
    <body class="bg-gray-100">
        <div id="root"></div>
        
        <script type="module">
          import React from 'https://esm.sh/react@18.2.0';
          import ReactDOM from 'https://esm.sh/react-dom@18.2.0/client';
          import { useState, useEffect } from 'https://esm.sh/react@18.2.0';
          
          const API_BASE = '';
          
          function App() {
            const [categories, setCategories] = useState([]);
            const [selectedCategory, setSelectedCategory] = useState(null);
            const [categoryData, setCategoryData] = useState(null);
            const [products, setProducts] = useState([]);
            const [searchQuery, setSearchQuery] = useState('');
            const [searchResults, setSearchResults] = useState([]);
            const [selectedProducts, setSelectedProducts] = useState([]);
            const [weights, setWeights] = useState({});
            const [comparisonResult, setComparisonResult] = useState(null);
            const [uploading, setUploading] = useState(false);
            
            // Load categories on mount
            useEffect(() => {
              fetch(API_BASE + '/api/categories')
                .then(r => r.json())
                .then(data => setCategories(data));
            }, []);
            
            // Load category data when selected
            useEffect(() => {
              if (selectedCategory) {
                fetch(API_BASE + '/api/categories/' + selectedCategory + '/criteria')
                  .then(r => r.json())
                  .then(data => {
                    setCategoryData(data);
                    // Set default weights from first preset
                    const firstPreset = Object.values(data.presets)[0];
                    setWeights(firstPreset);
                    setSelectedProducts([]);
                    setComparisonResult(null);
                  });
              }
            }, [selectedCategory]);
            
            // Search products
            useEffect(() => {
              if (selectedCategory && searchQuery) {
                fetch(API_BASE + '/api/products?categoryId=' + selectedCategory + '&query=' + encodeURIComponent(searchQuery))
                  .then(r => r.json())
                  .then(data => setSearchResults(data));
              } else {
                setSearchResults([]);
              }
            }, [selectedCategory, searchQuery]);
            
            const addProduct = (product) => {
              if (selectedProducts.length >= 5) {
                alert('Maximum 5 products allowed');
                return;
              }
              if (!selectedProducts.find(p => p.id === product.id)) {
                setSelectedProducts([...selectedProducts, product]);
                setSearchQuery('');
                setSearchResults([]);
              }
            };
            
            const removeProduct = (productId) => {
              setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
              setComparisonResult(null);
            };
            
            const updateWeight = (key, value, lastModified = true) => {
              const newWeights = { ...weights, [key]: parseFloat(value) };
              
              // Auto-balance to sum to 100
              if (lastModified) {
                const total = Object.values(newWeights).reduce((sum, w) => sum + w, 0);
                const diff = total - 100;
                if (Math.abs(diff) > 0.1) {
                  newWeights[key] = Math.max(0, Math.min(100, newWeights[key] - diff));
                }
              }
              
              setWeights(newWeights);
            };
            
            const loadPreset = (presetName) => {
              setWeights(categoryData.presets[presetName]);
            };
            
            const resetWeights = () => {
              const firstPreset = Object.values(categoryData.presets)[0];
              setWeights(firstPreset);
            };
            
            const compare = async () => {
              if (selectedProducts.length < 2) {
                alert('Please select at least 2 products');
                return;
              }
              
              const response = await fetch(API_BASE + '/api/compare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  categoryId: selectedCategory,
                  productIds: selectedProducts.map(p => p.id),
                  weights
                })
              });
              
              const result = await response.json();
              setComparisonResult(result);
            };
            
            const exportCSV = () => {
              if (!comparisonResult) return;
              
              let csv = 'Product,Brand,Model';
              comparisonResult.criteria.forEach(c => {
                csv += ',' + c.label + ' (raw),' + c.label + ' (norm),' + c.label + ' (contrib)';
              });
              csv += ',Total Score\\n';
              
              comparisonResult.ranking.forEach(productId => {
                const product = selectedProducts.find(p => p.id === productId);
                const score = comparisonResult.scores[productId];
                csv += productId + ',' + product.brand + ',' + product.model;
                
                comparisonResult.criteria.forEach(c => {
                  const s = score[c.key];
                  csv += ',' + s.raw + ',' + s.norm.toFixed(3) + ',' + s.contrib.toFixed(3);
                });
                csv += ',' + score.total.toFixed(3) + '\\n';
              });
              
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'comparison_' + new Date().getTime() + '.csv';
              a.click();
            };
            
            const handleFileUpload = async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              
              const formData = new FormData();
              formData.append('file', file);
              formData.append('categoryId', selectedCategory);
              
              setUploading(true);
              try {
                const response = await fetch(API_BASE + '/api/upload', {
                  method: 'POST',
                  body: formData
                });
                
                const result = await response.json();
                if (result.errors.length > 0) {
                  alert('Upload completed with errors:\\n' + 
                    result.errors.map(e => 'Row ' + e.row + ': ' + e.message).join('\\n'));
                } else {
                  alert('Successfully added ' + result.added + ' products');
                }
              } catch (error) {
                alert('Upload failed: ' + error.message);
              } finally {
                setUploading(false);
              }
            };
            
            const weightSum = Object.values(weights).reduce((sum, w) => sum + w, 0);
            const weightsValid = Math.abs(weightSum - 100) < 0.1;
            
            return React.createElement('div', { className: 'container mx-auto p-8' },
              React.createElement('h1', { className: 'text-4xl font-bold text-gray-800 mb-8' },
                React.createElement('i', { className: 'fas fa-balance-scale mr-3' }),
                'Product Comparison Tool'
              ),
              
              // Category Selection
              React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6 mb-6' },
                React.createElement('h2', { className: 'text-2xl font-semibold mb-4' }, 'Select Category'),
                React.createElement('select', {
                  className: 'w-full p-3 border border-gray-300 rounded-lg',
                  value: selectedCategory || '',
                  onChange: (e) => setSelectedCategory(e.target.value)
                },
                  React.createElement('option', { value: '' }, 'Choose a category...'),
                  categories.map(cat => 
                    React.createElement('option', { key: cat.id, value: cat.id }, cat.name)
                  )
                )
              ),
              
              // Product Search & Selection
              selectedCategory && React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6 mb-6' },
                React.createElement('h2', { className: 'text-2xl font-semibold mb-4' }, 'Search & Add Products'),
                React.createElement('div', { className: 'mb-4' },
                  React.createElement('input', {
                    type: 'text',
                    className: 'w-full p-3 border border-gray-300 rounded-lg',
                    placeholder: 'Search by brand or model...',
                    value: searchQuery,
                    onChange: (e) => setSearchQuery(e.target.value)
                  }),
                  searchResults.length > 0 && React.createElement('div', { className: 'mt-2 border border-gray-300 rounded-lg max-h-60 overflow-y-auto' },
                    searchResults.map(product =>
                      React.createElement('div', {
                        key: product.id,
                        className: 'p-3 hover:bg-gray-100 cursor-pointer flex justify-between items-center',
                        onClick: () => addProduct(product)
                      },
                        React.createElement('span', null, product.brand + ' ' + product.model),
                        React.createElement('button', { className: 'bg-blue-500 text-white px-3 py-1 rounded' }, 'Add')
                      )
                    )
                  )
                ),
                
                // Selected Products
                React.createElement('div', { className: 'mb-4' },
                  React.createElement('h3', { className: 'font-semibold mb-2' }, 
                    'Selected Products (' + selectedProducts.length + '/5)'
                  ),
                  React.createElement('div', { className: 'flex flex-wrap gap-2' },
                    selectedProducts.map(product =>
                      React.createElement('div', {
                        key: product.id,
                        className: 'bg-blue-100 px-3 py-2 rounded-lg flex items-center gap-2'
                      },
                        React.createElement('span', null, product.brand + ' ' + product.model),
                        React.createElement('button', {
                          className: 'text-red-500 hover:text-red-700',
                          onClick: () => removeProduct(product.id)
                        }, '✕')
                      )
                    )
                  )
                ),
                
                // File Upload
                React.createElement('div', { className: 'mt-4' },
                  React.createElement('label', { className: 'block mb-2 font-semibold' }, 'Upload Products (JSON)'),
                  React.createElement('input', {
                    type: 'file',
                    accept: '.json',
                    onChange: handleFileUpload,
                    disabled: uploading,
                    className: 'block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
                  })
                )
              ),
              
              // Weight Sliders
              selectedCategory && categoryData && React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6 mb-6' },
                React.createElement('h2', { className: 'text-2xl font-semibold mb-4' }, 'Adjust Weights'),
                React.createElement('div', { className: 'mb-4' },
                  React.createElement('span', { className: 'font-semibold' }, 'Total: '),
                  React.createElement('span', { 
                    className: weightsValid ? 'text-green-600' : 'text-red-600'
                  }, weightSum.toFixed(1)),
                  React.createElement('span', null, ' / 100')
                ),
                
                categoryData.criteria.map(criterion =>
                  React.createElement('div', { key: criterion.key, className: 'slider-container' },
                    React.createElement('label', { className: 'w-40' }, criterion.label),
                    React.createElement('input', {
                      type: 'range',
                      min: '0',
                      max: '100',
                      step: '1',
                      value: weights[criterion.key] || 0,
                      onChange: (e) => updateWeight(criterion.key, e.target.value),
                      className: 'slider'
                    }),
                    React.createElement('span', { className: 'w-12 text-right' }, (weights[criterion.key] || 0).toFixed(0))
                  )
                ),
                
                React.createElement('div', { className: 'mt-4 flex gap-2' },
                  React.createElement('button', {
                    onClick: resetWeights,
                    className: 'bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600'
                  }, 'Reset'),
                  Object.keys(categoryData.presets).map(presetName =>
                    React.createElement('button', {
                      key: presetName,
                      onClick: () => loadPreset(presetName),
                      className: 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
                    }, presetName)
                  )
                )
              ),
              
              // Compare Button
              selectedCategory && selectedProducts.length >= 2 && React.createElement('div', { className: 'text-center mb-6' },
                React.createElement('button', {
                  onClick: compare,
                  disabled: !weightsValid,
                  className: 'bg-green-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed'
                }, 'Compare Products')
              ),
              
              // Comparison Results
              comparisonResult && React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6 mb-6' },
                React.createElement('h2', { className: 'text-2xl font-semibold mb-4' }, 'Comparison Results'),
                
                // Winner Explanation
                React.createElement('div', { className: 'bg-green-50 border-l-4 border-green-500 p-4 mb-6' },
                  React.createElement('h3', { className: 'font-bold text-lg mb-2' }, 
                    'Winner: ' + 
                    selectedProducts.find(p => p.id === comparisonResult.rationale.winnerId)?.brand + ' ' +
                    selectedProducts.find(p => p.id === comparisonResult.rationale.winnerId)?.model
                  ),
                  React.createElement('p', { className: 'mb-2' }, 'Why it wins:'),
                  React.createElement('ul', { className: 'list-disc list-inside' },
                    comparisonResult.rationale.helps.map((h, i) =>
                      React.createElement('li', { key: i }, 
                        h.criterion + ': Strong contribution (' + (h.contribution * 100).toFixed(1) + '%)'
                      )
                    )
                  ),
                  comparisonResult.rationale.hurts.length > 0 && React.createElement('div', null,
                    React.createElement('p', { className: 'mt-2 mb-1' }, 'Weak point:'),
                    React.createElement('ul', { className: 'list-disc list-inside' },
                      comparisonResult.rationale.hurts.map((h, i) =>
                        React.createElement('li', { key: i }, 
                          h.criterion + ': Low contribution (' + (h.contribution * 100).toFixed(1) + '%)'
                        )
                      )
                    )
                  )
                ),
                
                // Comparison Table
                React.createElement('div', { className: 'overflow-x-auto' },
                  React.createElement('table', { className: 'w-full border-collapse border border-gray-300' },
                    React.createElement('thead', null,
                      React.createElement('tr', { className: 'bg-gray-200' },
                        React.createElement('th', { className: 'border border-gray-300 p-2' }, 'Criterion'),
                        comparisonResult.ranking.map(productId => {
                          const product = selectedProducts.find(p => p.id === productId);
                          const score = comparisonResult.scores[productId];
                          const rank = comparisonResult.ranking.indexOf(productId) + 1;
                          return React.createElement('th', { key: productId, className: 'border border-gray-300 p-2' },
                            React.createElement('div', null, '#' + rank + ' ' + product.brand),
                            React.createElement('div', null, product.model),
                            React.createElement('div', { className: 'text-sm font-normal' }, 
                              'Score: ' + (score.total * 100).toFixed(1) + '%'
                            )
                          );
                        })
                      )
                    ),
                    React.createElement('tbody', null,
                      comparisonResult.criteria.map(criterion => {
                        // Find best value for highlighting
                        const values = comparisonResult.ranking.map(pid => 
                          comparisonResult.scores[pid][criterion.key].raw
                        );
                        const bestValue = criterion.goal === 'max' ? Math.max(...values) : Math.min(...values);
                        
                        return React.createElement('tr', { key: criterion.key },
                          React.createElement('td', { className: 'border border-gray-300 p-2 font-semibold' }, 
                            criterion.label
                          ),
                          comparisonResult.ranking.map(productId => {
                            const score = comparisonResult.scores[productId][criterion.key];
                            const isBest = score.raw === bestValue;
                            
                            return React.createElement('td', {
                              key: productId,
                              className: 'border border-gray-300 p-2 text-center tooltip ' + (isBest ? 'best-value' : '')
                            },
                              React.createElement('div', null, score.raw + (criterion.unit ? ' ' + criterion.unit : '')),
                              React.createElement('span', { className: 'tooltiptext' },
                                'Raw: ' + score.raw + (criterion.unit ? ' ' + criterion.unit : '') + '\\n' +
                                'Normalized: ' + score.norm.toFixed(3) + '\\n' +
                                'Weight: ' + (score.weight * 100).toFixed(1) + '%\\n' +
                                'Contribution: ' + (score.contrib * 100).toFixed(1) + '%'
                              )
                            );
                          })
                        );
                      })
                    )
                  )
                ),
                
                // Export Button
                React.createElement('div', { className: 'mt-6 text-center' },
                  React.createElement('button', {
                    onClick: exportCSV,
                    className: 'bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600'
                  }, 'Export as CSV')
                )
              )
            );
          }
          
          const root = ReactDOM.createRoot(document.getElementById('root'));
          root.render(React.createElement(App));
        </script>
    </body>
    </html>
  `);
});

export default app;
