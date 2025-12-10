# Architecture Diagrams - Export Ready

This directory contains all architecture diagrams from `ARCHITECTURE_DIAGRAM.md` converted to visual formats (PNG) that can be easily exported, shared, and printed.

## 📁 Contents

### Individual PNG Files (High Resolution)
All diagrams are available as separate PNG files with transparent backgrounds:

1. **01-system-architecture.png** (2400x1800px) - Complete system architecture overview
2. **02-auth-flow.png** (1600x1200px) - Authentication & authorization flow
3. **03-ai-analysis-flow.png** (1600x1200px) - AI analysis request flow
4. **04-payment-flow.png** (1600x1400px) - Payment & upgrade flow with Stripe
5. **05-google-ads-integration.png** (1600x1400px) - Google Ads OAuth integration
6. **06-database-schema.png** (1600x1200px) - Database schema with relationships
7. **07-tech-stack.png** (2000x1200px) - Technology stack overview
8. **08-deployment-architecture.png** (2000x1400px) - Deployment pipeline
9. **09-rls-architecture.png** (1800x1200px) - Row-Level Security architecture
10. **10-environment-variables.png** (1800x1200px) - Environment variables configuration

### HTML Viewer (viewer.html)
A beautiful, interactive HTML page that displays all diagrams with descriptions. Perfect for:
- **Viewing all diagrams** in a single scrollable page
- **Printing to PDF** using your browser's print function (Ctrl+P / Cmd+P)
- **Presentations** - open in browser and present directly
- **Sharing** - send the HTML file along with PNG files

### Mermaid Source Files (*.mmd)
Original Mermaid diagram source files for future editing:
- `01-system-architecture.mmd`
- `02-auth-flow.mmd`
- `03-ai-analysis-flow.mmd`
- etc.

## 🚀 How to Use

### Option 1: View Individual PNG Files
Simply open any PNG file with your default image viewer. These are high-resolution images suitable for:
- Embedding in documentation
- Adding to presentations (PowerPoint, Google Slides)
- Printing
- Sharing via email or messaging apps

### Option 2: Use the HTML Viewer
1. **Double-click `viewer.html`** to open it in your default web browser
2. **Scroll through** all diagrams with descriptions
3. **Print to PDF**:
   - Click the "Print/Save as PDF" button, OR
   - Press `Ctrl+P` (Windows) or `Cmd+P` (Mac)
   - Select "Save as PDF" as the printer
   - Adjust print settings (margins, orientation)
   - Save the PDF file

### Option 3: Edit Diagrams (Advanced)
If you need to modify any diagram:
1. Edit the `.mmd` file with any text editor
2. Regenerate PNG using mermaid-cli:
   ```bash
   cd architecture-diagrams
   npx mmdc -i 01-system-architecture.mmd -o 01-system-architecture.png -b transparent -w 2400 -H 1800
   ```

## 📋 File Sizes & Formats

| File Type | Format | Use Case |
|-----------|--------|----------|
| PNG Files | Raster (transparent background) | Embedding in docs, presentations, printing |
| HTML Viewer | Web page | Interactive viewing, PDF export |
| MMD Files | Plain text | Source editing, version control |

## 🎨 PNG Specifications

- **Format**: PNG (Portable Network Graphics)
- **Background**: Transparent
- **Color Space**: RGB
- **Resolution**: High-DPI ready (varies by diagram, see sizes above)
- **Quality**: Lossless compression

## 💡 Tips

### For Presentations
- Use the HTML viewer for live presentations
- Or embed individual PNG files in PowerPoint/Google Slides
- PNG files have transparent backgrounds - they work on any background color

### For Documentation
- PNG files can be directly embedded in Markdown, Word, or Confluence
- Use descriptive alt text from the diagram descriptions in viewer.html

### For Printing
- Use the HTML viewer's print function for the best results
- Select "Fit to page" in print settings for optimal sizing
- Consider landscape orientation for wider diagrams

### For Sharing
- Share the entire `architecture-diagrams` folder as a ZIP file
- Or share individual PNG files as needed
- HTML viewer works offline - no internet required

## 🔧 Technical Details

### Generated With
- **Mermaid CLI** (@mermaid-js/mermaid-cli)
- **Puppeteer** (for rendering)
- **Node.js** (execution environment)

### Command Used
```bash
npx mmdc -i [input.mmd] -o [output.png] -b transparent -w [width] -H [height]
```

### Browser Compatibility (HTML Viewer)
- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

## 📝 Notes

- All diagrams maintain their original styling from the source Mermaid code
- Colors are consistent with the original ARCHITECTURE_DIAGRAM.md
- HTML viewer is fully responsive and mobile-friendly
- Print styles are optimized for PDF export (page breaks, etc.)

## 🆘 Troubleshooting

### PNG files won't open
- Ensure you have an image viewer installed
- Try opening in a web browser (drag & drop the PNG file)

### HTML viewer looks broken
- Make sure all PNG files are in the same directory as viewer.html
- Open in a modern browser (Chrome, Firefox, Edge)

### Need higher resolution
- Edit the regeneration command to increase `-w` and `-H` values
- Rerun the mmdc command for that specific diagram

## 📧 Questions?

If you need to modify or regenerate these diagrams, refer to the Mermaid documentation:
- https://mermaid.js.org/
- https://github.com/mermaid-js/mermaid-cli

---

**Generated**: 2025-11-21
**Source**: ARCHITECTURE_DIAGRAM.md
**Tool**: Mermaid CLI v11.x
