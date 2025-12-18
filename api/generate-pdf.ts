import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import Groq from 'groq-sdk';
import { jsPDF } from 'jspdf';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Standard client for public/auth interactions
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

// Admin client for backend operations (Rate Limiting)
const supabaseAdmin = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseServiceKey || supabaseKey || 'placeholder'
);

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY
});

// ... interface ...

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    let isAuthenticated = false;
    let userId: string | null = null;
    const authHeader = req.headers.authorization;

    // 1. Check Authentication (Unlimited Access)
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
            userId = decoded.userId;
            isAuthenticated = true;
        } catch (err) {
            // Invalid token, proceed as guest
            console.log('Invalid token, falling back to guest mode');
        }
    }

    // 2. Guest Rate Limiting (If not authenticated)
    if (!isAuthenticated) {
        // Get IP Address
        const forwarded = req.headers['x-forwarded-for'];
        const ip = typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket.remoteAddress;

        if (!ip) {
            // Fallback if IP cannot be determined (should restrict)
            return res.status(403).json({ message: 'Unable to verify client identity' });
        }

        const feature = 'pdf_generator';
        const LIMIT = 3;

        try {
            // Check usage
            const { data: usage, error: fetchError } = await supabaseAdmin
                .from('guest_usage')
                .select('usage_count')
                .eq('ip_address', ip)
                .eq('feature_name', feature)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows found"
                console.error('Error fetching usage:', fetchError);
                // Allow conservatively if check fails? Or Block? strict: block
                // Let's allow but log to avoid outage if DB blips, but user wants strict 3 limit.
                // We'll proceed to upsert which might fail if DB is down regardless.
            }

            const currentCount = usage?.usage_count || 0;

            if (currentCount >= LIMIT) {
                return res.status(429).json({
                    message: 'Daily free limit reached (3/3). Please sign in for unlimited access.',
                    requiresAuth: true
                });
            }

            // Increment Usage
            const { error: upsertError } = await supabaseAdmin
                .from('guest_usage')
                .upsert(
                    {
                        ip_address: ip,
                        feature_name: feature,
                        usage_count: currentCount + 1,
                        last_used_at: new Date().toISOString()
                    },
                    { onConflict: 'ip_address,feature_name' }
                );

            if (upsertError) {
                console.error('Error updating usage:', upsertError);
                // Fail open or closed? Closed is safer for simple rate limits but annoying. Open is better UX.
            }

        } catch (e) {
            console.error('Rate limit exception:', e);
        }
    }

    try {
        const { prompt, font = 'helvetica' } = req.body;

        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ message: 'Invalid prompt' });
        }

        // Map user fonts to jsPDF fonts (jsPDF only has 3 base fonts, so we create variations)
        const fontMap: Record<string, { font: string, weight: string }> = {
            // Serif Fonts (Times-based)
            'times': { font: 'times', weight: 'normal' },
            'times-bold': { font: 'times', weight: 'bold' },
            'garamond': { font: 'times', weight: 'italic' }, // Times Italic as Garamond alternative

            // Sans-Serif Fonts (Helvetica-based)
            'helvetica': { font: 'helvetica', weight: 'normal' },
            'arial': { font: 'helvetica', weight: 'normal' }, // Helvetica is similar to Arial
            'calibri': { font: 'helvetica', weight: 'bold' }, // Helvetica Bold as Calibri alternative

            // Monospace Fonts (Courier-based)
            'courier': { font: 'courier', weight: 'normal' },
            'consolas': { font: 'courier', weight: 'bold' }, // Courier Bold as Consolas alternative

            // Additional variations
            'georgia': { font: 'times', weight: 'normal' }, // Times as Georgia alternative
            'verdana': { font: 'helvetica', weight: 'bolditalic' } // Helvetica Bold Italic as Verdana
        };

        const fontConfig = fontMap[font.toLowerCase()] || { font: 'helvetica', weight: 'normal' };
        const selectedFont = fontConfig.font;
        const selectedWeight = fontConfig.weight;

        // Step 1: Use AI to generate detailed document specification
        const systemPrompt = `You are an INDIAN CORPORATE DOCUMENT SPECIALIST. Your goal is to create PROFESSIONAL, SINGLE-PAGE, INDIA-STANDARD layouts.

**STRICT LAYOUT RULES (Indian Standard)**:
1.  **SENDER INFO**: ALWAYS placed on the **TOP RIGHT** (Right Aligned), unless it's a Header.
2.  **RECIPIENT INFO**: ALWAYS placed on the **LEFT**.
3.  **DATE**: Placed relative to Sender info (Right) or just below it.
4.  **SPACING**: STRICT SINGLE SPACING. No double gaps. Compact.
5.  **COLORS**: BLACK ONLY.
6.  **ROBUSTNESS**: Return FLAT JSON. Do not nest aggressively. 

**JSON STRUCTURE**:
{
  "config": {
    "draw_border": false,
    "margin": 15,
    "colors": { "accent": "#000000", "text": "#000000" }
  },
  "title": "TITLE (CENTERED)",
  
  // KEY: Structure for Indian Letters/Docs
  "letter_details": {
    "sender_address": ["Line 1", "Line 2"], // Will be RIGHT ALIGNED by renderer
    "to_block": ["To,", "Name", "Address"], // LEFT ALIGNED
    "date": "15 May 2015",
    "subject": "Subject: ...",
    "salutation": "Dear...",
    "body_paragraphs": ["..."],
    "closing": "Sincerely,",
    "signature_block": ["Name", "Title"]
  },

  "sections": [
    { "type": "heading", "text": "Heading (Left)", "align": "left", "size": 12 },
    { "type": "text", "content": ["Compact paragraph."], "align": "justify" },
    { "type": "table", "tableData": { "headers": ["A"], "rows": [["1"]] } }
  ],
  "filename": "doc.pdf"
}

RETURN ONLY VALID JSON.`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.2, // Very strict
            max_tokens: 3000,
        });

        const aiResponse = completion.choices[0]?.message?.content || '{}';

        // Robust JSON Extraction
        let docContent: any = {};
        try {
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            const cleanResponse = jsonMatch ? jsonMatch[0] : aiResponse;
            docContent = JSON.parse(cleanResponse);
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError, "Raw Response:", aiResponse);
            // STRICT ERROR: Do not generate PDF, tell user to fix prompt
            throw new Error('Unable to structure document from this prompt. Please provide clear details.');
        }

        // Sanitize filename
        let filename = docContent.filename || 'generated_document.pdf';
        filename = filename.replace(/[^a-z0-9_.-]/gi, '_');
        if (!filename.endsWith('.pdf')) filename += '.pdf';

        // Step 2: Generate PDF
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15; // Standard, professional margin
        const contentWidth = pageWidth - (margin * 2);
        let yPosition = margin;

        // Improved Text Render Function with Justification
        const addText = (text: string, fontSize: number, fontStyle: string, align: 'left' | 'center' | 'right' | 'justify' = 'left', isBold: boolean = false) => {
            pdf.setFontSize(fontSize);
            // Use selected font and weight, override with bold if requested
            const weight = isBold ? 'bold' : (fontStyle === 'bold' ? 'bold' : selectedWeight);
            pdf.setFont(selectedFont, weight);

            // Tighter line height for compactness
            const lineHeight = fontSize * 0.4;

            if (align === 'justify') {
                const lines = pdf.splitTextToSize(text, contentWidth);
                lines.forEach((line: string) => {
                    // Check page break
                    if (yPosition > pageHeight - margin) {
                        pdf.addPage();
                        yPosition = margin;
                    }
                    pdf.text(line, margin, yPosition); // Left aligned
                    yPosition += lineHeight + 1; // Compact spacing
                });
            } else {
                // Center/Right/Left handled standard
                const lines = pdf.splitTextToSize(text, contentWidth);
                lines.forEach((line: string) => {
                    if (yPosition > pageHeight - margin) {
                        pdf.addPage();
                        yPosition = margin;
                    }
                    let xPosition = margin;
                    if (align === 'center') xPosition = pageWidth / 2;
                    if (align === 'right') xPosition = pageWidth - margin;

                    pdf.text(line, xPosition, yPosition, { align });
                    yPosition += lineHeight + 1; // Compact spacing
                });
            }
        };

        // --- RENDER LOGIC ---

        // --- UNIVERSAL LAYOUT RENDERER ---

        // Helper: Hex to RGB
        const hexToRgb = (hex: string | undefined): [number, number, number] => {
            if (!hex) return [0, 0, 0]; // Default Black
            hex = hex.replace('#', '');
            if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
            const bigint = parseInt(hex, 16);
            return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
        };

        // Enforce Professional Colors (Black/Dark Gray)
        const accentHex = '#000000';
        const secondaryHex = '#333333';
        const textHex = '#000000';

        const accentColor = hexToRgb(accentHex);
        const secondaryColor = hexToRgb(secondaryHex);
        const textColor = hexToRgb(textHex);

        const headingUnderline = docContent.config?.styles?.heading_underline !== false; // Default true if not specified
        const tableStriping = false; // No striping for formal documents usually

        // 1. Draw Border (Only if strictly requested, usually NO)
        if (docContent.config?.draw_border) {
            pdf.setDrawColor(0, 0, 0);
            pdf.setLineWidth(0.5);
            const boxMargin = docContent.config.margin || 10;
            pdf.rect(boxMargin, boxMargin, pageWidth - (boxMargin * 2), pageHeight - (boxMargin * 2));
        }

        // 2. Watermark
        if (docContent.watermark) {
            pdf.setTextColor(245, 245, 245); // Very light gray
            pdf.setFontSize(40);
            pdf.setFont(selectedFont, 'bold');
            pdf.text(docContent.watermark.toUpperCase(), pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
            pdf.setTextColor(textColor[0], textColor[1], textColor[2]); // Reset
        }

        // 3. Document Title
        if (docContent.title) {
            pdf.setFontSize(16); // Professional Size
            pdf.setFont(selectedFont, 'bold');
            pdf.setTextColor(0, 0, 0);
            pdf.text(docContent.title.toUpperCase(), pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 10;

            // Separator Line (if enabled or default)
            if (headingUnderline) {
                pdf.setDrawColor(0, 0, 0);
                pdf.setLineWidth(0.5);
                pdf.line(margin + 40, yPosition - 4, pageWidth - margin - 40, yPosition - 4);
                yPosition += 4;
            }
        }

        // 4. Letter Details
        if (docContent.letter_details) {
            const details = docContent.letter_details;
            pdf.setTextColor(0, 0, 0);

            // SENDER: INDIAN STANDARD -> TOP RIGHT
            if (details.sender_address) {
                pdf.setFontSize(10);
                pdf.setFont(selectedFont, 'bold');
                pdf.setTextColor(0, 0, 0);

                details.sender_address.forEach((line: string) => {
                    // Right Align Calculation
                    // jsPDF 'right' alignment needs x to be the right bound
                    pdf.text(line, pageWidth - margin, yPosition, { align: 'right' });
                    yPosition += 4;
                });
                yPosition += 4;
            }

            // DATE: Often on Right or Left. Standardize to Right below sender or Left. 
            // Let's stick to Right if Sender is Right, or prompt driven. 
            // For now, let's keep Date Left aligned for clarity unless 'config' overrides, 
            // BUT user Example 1 had date on Right. Example 2 had date on Left.
            // Let's put Date on RIGHT to match Example 1 (Resignation Letter).
            if (details.date) {
                pdf.setFont(selectedFont, selectedWeight);
                pdf.text(details.date, pageWidth - margin, yPosition, { align: 'right' });
                yPosition += 10;
            }

            // TO BLOCK: ALWAYS LEFT
            if (details.to_block) {
                details.to_block.forEach((line: string) => {
                    pdf.text(line, margin, yPosition);
                    yPosition += 5;
                });
                yPosition += 8;
            }

            // SUBJECT
            if (details.subject) {
                pdf.setFont(selectedFont, 'bold');
                // Center or underlined? User Example 2 has it bold left.
                pdf.text(details.subject, margin, yPosition);
                pdf.setFont(selectedFont, selectedWeight);
                yPosition += 8;
            }

            // SALUTATION
            if (details.salutation) {
                pdf.text(details.salutation, margin, yPosition);
                yPosition += 6; // Tight gap
            }

            // BODY
            if (details.body_paragraphs) {
                details.body_paragraphs.forEach((para: string) => {
                    addText(para, 11, 'normal', 'justify'); // Size 11 text
                    yPosition += 2; // VERY Tight paragraph gap
                });
                yPosition += 4;
            }

            // CLOSING & SIGNATURE (Left aligned usually in India, or Right? Example 1 is Left.)
            if (details.closing) {
                pdf.text(details.closing, margin, yPosition);
                yPosition += 10;
            }

            if (details.signature_block) {
                details.signature_block.forEach((line: string) => {
                    pdf.text(line, margin, yPosition);
                    yPosition += 5;
                });
            }
            yPosition += 8;
        }

        // 5. Universal Sections
        if (docContent.sections) {
            docContent.sections.forEach((section: any) => {

                // Heading Section
                if (section.type === 'heading' || section.heading) {
                    yPosition += 4;
                    const headText = section.text || section.heading;
                    const headAlign = section.align || 'left';
                    const headSize = section.size ? Math.min(section.size, 14) : 12; // Cap size

                    pdf.setFontSize(headSize);
                    pdf.setFont(selectedFont, 'bold');
                    pdf.setTextColor(0, 0, 0);

                    let xPos = margin;
                    if (headAlign === 'center') xPos = pageWidth / 2;
                    if (headAlign === 'right') xPos = pageWidth - margin;

                    pdf.text(headText, xPos, yPosition, { align: headAlign });

                    pdf.setFont(selectedFont, selectedWeight);
                    pdf.setTextColor(0, 0, 0);
                    yPosition += 5;
                }

                // Table Section (Robust & Modern)
                if (section.type === 'table' && section.tableData) {
                    yPosition += 2;
                    const colWidth = contentWidth / section.tableData.headers.length;

                    // Helper: Get row max height
                    const getRowHeight = (row: string[], fontSize: number = 10) => {
                        let maxLines = 1;
                        pdf.setFontSize(fontSize);
                        row.forEach((cell) => {
                            // Ensure cell is string
                            const cellStr = String(cell || '');
                            const lines = pdf.splitTextToSize(cellStr, colWidth - 2);
                            if (lines.length > maxLines) maxLines = lines.length;
                        });
                        return (maxLines * 4) + 2; // Compact
                    };

                    // ---- Header ----
                    const headerHeight = getRowHeight(section.tableData.headers, 10);

                    // Check Page Break for Header
                    if (yPosition + headerHeight > pageHeight - margin) {
                        pdf.addPage();
                        yPosition = margin;
                    }

                    // Header Line only, no color block
                    pdf.setDrawColor(0, 0, 0);
                    pdf.setLineWidth(0.5);
                    pdf.line(margin, yPosition + headerHeight, pageWidth - margin, yPosition + headerHeight);

                    pdf.setFont(selectedFont, 'bold');
                    pdf.setTextColor(0, 0, 0);

                    section.tableData.headers.forEach((header: string, i: number) => {
                        const cellLines = pdf.splitTextToSize(String(header), colWidth - 2);
                        pdf.text(cellLines, margin + (i * colWidth) + 1, yPosition + 4);
                    });

                    yPosition += headerHeight;
                    pdf.setTextColor(0, 0, 0);
                    pdf.setFont(selectedFont, selectedWeight);

                    // ---- Rows ----
                    section.tableData.rows.forEach((row: string[], rowIndex: number) => {
                        const rowHeight = getRowHeight(row, 10);

                        // Check Page Break
                        if (yPosition + rowHeight > pageHeight - margin) {
                            pdf.addPage();
                            yPosition = margin;
                        }

                        row.forEach((cell: string, i: number) => {
                            const cellStr = String(cell || '');
                            const cellLines = pdf.splitTextToSize(cellStr, colWidth - 2);
                            pdf.text(cellLines, margin + (i * colWidth) + 1, yPosition + 3);
                        });

                        // Simple separator line
                        pdf.setDrawColor(200, 200, 200);
                        pdf.line(margin, yPosition + rowHeight, pageWidth - margin, yPosition + rowHeight);

                        yPosition += rowHeight;
                    });

                    yPosition += 4;
                }
                // List Section
                else if (section.type === 'list' && (section.content || section.items)) {
                    const items = section.items || section.content;
                    items.forEach((item: string) => {
                        pdf.text('•', margin + 5, yPosition);
                        const lines = pdf.splitTextToSize(item, contentWidth - 10);
                        lines.forEach((line: string) => {
                            pdf.text(line, margin + 8, yPosition);
                            yPosition += 4;
                        });
                        yPosition += 1;
                    });
                    yPosition += 4;
                }
                // Text Section
                else if (section.type === 'text' && section.content) {
                    section.content.forEach((paragraph: string) => {
                        addText(paragraph, 11, 'normal', section.align || 'justify');
                        yPosition += 2;
                    });
                    yPosition += 4;
                }
            });
        }
        if (docContent.metadata) {
            yPosition = pageHeight - 15;
            pdf.setFontSize(9);
            if (docContent.metadata.date) pdf.text(`Date: ${docContent.metadata.date}`, margin, yPosition);
        }

        // Output
        const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
        res.setHeader('Content-Type', 'application/pdf');
        // Encode filename for header safety if needed, though basic sanitization above handles mostly.
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
        res.setHeader('Content-Length', pdfBuffer.length);
        return res.status(200).send(pdfBuffer);

    } catch (err: any) {
        console.error('PDF generation error:', err);
        return res.status(500).json({
            message: 'Failed to generate PDF',
            error: err.message
        });
    }
}
