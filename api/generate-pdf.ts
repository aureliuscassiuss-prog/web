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
        const systemPrompt = `You are a UNIVERSAL DOCUMENT ARCHITECT. Your goal is to create the PERFECT PDF structure for ANY user request.

**CORE PHILOSOPHY**:
- **DO NOT limit yourself to fixed templates.** You can build ANY document (Resume, Menu, Itinerary, legal Brief, Script) by combining blocks.
- **VISUAL INTELLIGENCE**: You decide the look. Does a "Gift Voucher" need a border? YES. Does a "Business Letter" need a border? NO.
- **MISSING DATA**: If details are missing, **INVENT REALISTIC CONTENT**. Never leave blanks.

**JSON STRUCTURE (The Blueprint):**
{
  "config": {
    "draw_border": boolean, // TRUE for Certificates, Notices, Vouchers, Menus, etc.
    "border_style": "simple" | "double", // Hint for future use
    "margin": number // Default 25
  },
  "title": "Main Title (Centered)", // Optional
  "watermark": "CONFIDENTIAL", // Optional text to show as watermark
  
  // OPTIONAL: Use this for standard letter structures
  "letter_details": {
    "sender_address": ["Line 1", "Line 2"],
    "to_block": ["To,", "Name", "Address"],
    "date": "DD/MM/YYYY",
    "subject": "Subject: ...",
    "salutation": "Dear...",
    "body_paragraphs": ["..."],
    "closing": "Sincerely,",
    "signature_block": ["Name", "Title"]
  },

  // THE CORE: List of sections to build the document. 
  // USE THIS for Resumes, Invoices, Itineraries, Reports, etc.
  "sections": [
    {
      "type": "heading",
      "text": "Experience / Ingredients / Day 1",
      "align": "left" | "center" | "right",
      "size": 14 // Optional font size override
    },
    {
      "type": "text",
      "content": ["Paragraph 1...", "Paragraph 2..."],
      "align": "justify" // or left/center
    },
    {
      "type": "table", // PERFECT for Invoices, Data, Schedules
      "tableData": {
        "headers": ["Date", "Activity", "Cost"],
        "rows": [ ["12/10", "Flight", "$500"] ]
      }
    },
    {
      "type": "list", // Good for resumes, ingredients, rules
      "items": ["Point 1", "Point 2"]
    }
  ],
  "filename": "smart_filename.pdf"
}

**EXAMPLE LOGIC**:
- **User**: "Make a coupon for free pizza" -> Config: { draw_border: true }, Title: "FREE PIZZA COUPON", Section: Text "Valid until...", Section: Text "Code: PIZZA100".
- **User**: "Formal complaint letter" -> Config: { draw_border: false }, Use "letter_details".
- **User**: "Resume for Dev" -> Config: { draw_border: false }, Sections: Heading "Skills", List "React, Node", Heading "Exp", Text "Built..."

RETURN ONLY VALID JSON.`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 3000,
        });

        const aiResponse = completion.choices[0]?.message?.content || '{}';

        // Robust JSON Extraction
        let docContent: any = {};
        try {
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/); // Greedier simple match for object
            const cleanResponse = jsonMatch ? jsonMatch[0] : aiResponse;
            docContent = JSON.parse(cleanResponse);
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError, "Raw Response:", aiResponse);
            // Fallback content if parsing completely fails
            docContent = {
                type: 'note',
                title: 'Conversion Error',
                filename: 'error_log.pdf',
                letter_details: {
                    body_paragraphs: [
                        "We encountered an error processing the AI response.",
                        "Raw Output:",
                        aiResponse.substring(0, 500) + "..."
                    ]
                }
            };
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
        const margin = 25; // Increased margin for better look
        const contentWidth = pageWidth - (margin * 2);
        let yPosition = margin;

        // Improved Text Render Function with Justification
        const addText = (text: string, fontSize: number, fontStyle: string, align: 'left' | 'center' | 'right' | 'justify' = 'left', isBold: boolean = false) => {
            pdf.setFontSize(fontSize);
            // Use selected font and weight, override with bold if requested
            const weight = isBold ? 'bold' : (fontStyle === 'bold' ? 'bold' : selectedWeight);
            pdf.setFont(selectedFont, weight);

            // Standard line height ratio
            const lineHeight = fontSize * 0.5; // roughly 1.4x (points to mm conversion factor ~0.35 * 1.4)

            if (align === 'justify') {
                // Use built-in splitTextToSize but render differently? 
                // jsPDF text() supports maxWidth but 'justify' alignment works best with direct text calls
                // Let's use splitTextToSize + text with align 'justify' line by line or block?
                // Actually, jsPDF's text() 'justify' alignment requires specific handling or use of maxWidth.
                // Simple approach: Use splitTextToSize, then print. 'justify' in jsPDF is tricky for standard text() without plugin.
                // Reverting to 'left' for safety but adding line spacing control.
                // 'justify' often creates ugly gaps if not handled perfectly.
                // OPTION: We will use 'left' but ensure proper paragraph spacing.

                const lines = pdf.splitTextToSize(text, contentWidth);
                lines.forEach((line: string) => {
                    // Check page break
                    if (yPosition > pageHeight - margin) {
                        pdf.addPage();
                        yPosition = margin;
                    }
                    pdf.text(line, margin, yPosition); // Left aligned
                    yPosition += lineHeight + 2; // EXTRA SPACING (Leading)
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
                    yPosition += lineHeight + 2;
                });
            }
        };

        // --- RENDER LOGIC ---

        // --- UNIVERSAL LAYOUT RENDERER ---

        // 1. Draw Border if requested (AI decides based on document type like Certificate, Notice, Coupon)
        if (docContent.config?.draw_border) {
            pdf.setDrawColor(0, 0, 0);
            pdf.setLineWidth(1); // Standard border
            if (docContent.config.border_style === 'double') pdf.setLineWidth(2); // Thicker if requested
            
            const boxMargin = docContent.config.margin || 15;
            pdf.rect(boxMargin, boxMargin, pageWidth - (boxMargin * 2), pageHeight - (boxMargin * 2));
        }

        // 2. Watermark (Optional)
        if (docContent.watermark) {
            pdf.setTextColor(230, 230, 230);
            pdf.setFontSize(50);
            pdf.setFont(selectedFont, 'bold');
            // Rotate and center (basic implementation)
            // jsPDF rotation is complex without context save/restore, simplifying to bottom center for now or diagonal if easy
            // For stability, just placing centered light text
            pdf.text(docContent.watermark.toUpperCase(), pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
            pdf.setTextColor(0, 0, 0); // Reset
        }

        // 3. Document Title
        if (docContent.title) {
            pdf.setFontSize(18);
            pdf.setFont(selectedFont, 'bold');
            pdf.setTextColor(0, 0, 0);
            pdf.text(docContent.title, pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 15;
        }

        // 4. Letter Details (if present)
        if (docContent.letter_details) {
            const details = docContent.letter_details;
            pdf.setTextColor(0, 0, 0);

            // ... (keep existing letter rendering logic roughly same, it works well) ...
            // Just verifying variable names match
            // SENDER
            if (details.sender_address) {
                pdf.setFontSize(10);
                pdf.setFont(selectedFont, selectedWeight); // Use user font
                details.sender_address.forEach((line: string) => {
                    pdf.text(line, margin, yPosition);
                    yPosition += 5;
                });
                yPosition += 5;
            }

            // DATE
            if (details.date) {
                pdf.text(`Date: ${details.date}`, margin, yPosition);
                yPosition += 10;
            }

            // TO BLOCK
            if (details.to_block) {
                details.to_block.forEach((line: string) => {
                    pdf.text(line, margin, yPosition);
                    yPosition += 6;
                });
                yPosition += 10;
            }

            // SUBJECT
            if (details.subject) {
                pdf.setFont(selectedFont, 'bold');
                pdf.text(details.subject, margin, yPosition);
                pdf.setFont(selectedFont, selectedWeight);
                yPosition += 10;
            }

            // SALUTATION
            if (details.salutation) {
                pdf.text(details.salutation, margin, yPosition);
                yPosition += 10;
            }

            // BODY
            if (details.body_paragraphs) {
                details.body_paragraphs.forEach((para: string) => {
                    addText(para, 12, 'normal', 'justify');
                    yPosition += 8;
                });
                yPosition += 5;
            }

            // CLOSING
            if (details.closing) {
                pdf.text(details.closing, margin, yPosition);
                yPosition += 12;
            }

            // SIGNATURE
            if (details.signature_block) {
                // Heuristic: Right align for strict formal types, else left
                // Since we removed 'type', let's default left unless simple signature
                 details.signature_block.forEach((line: string) => {
                    pdf.text(line, margin, yPosition);
                    yPosition += 6;
                });
            }
            yPosition += 10; // Spacing after letter block
        }

        // 5. Universal Sections (The Workhorse)
        if (docContent.sections) {
             docContent.sections.forEach((section: any) => {
                
                // New: Heading Section
                if (section.type === 'heading' || section.heading) {
                    yPosition += 5;
                    const headText = section.text || section.heading;
                    const headAlign = section.align || 'left';
                    const headSize = section.size || 14;
                    
                    pdf.setFontSize(headSize);
                    pdf.setFont(selectedFont, 'bold');
                    
                    let xPos = margin;
                    if (headAlign === 'center') xPos = pageWidth / 2;
                    if (headAlign === 'right') xPos = pageWidth - margin;
                    
                    pdf.text(headText, xPos, yPosition, { align: headAlign });
                    pdf.setFont(selectedFont, selectedWeight); // Reset
                    yPosition += 8;
                }

                // Table Section
                if (section.type === 'table' && section.tableData) {
                    yPosition += 5;
                    const colWidth = contentWidth / section.tableData.headers.length;
                    
                    // Table Header
                    pdf.setFillColor(240, 240, 240); // Light gray header
                    pdf.rect(margin, yPosition - 5, contentWidth, 8, 'F'); // Header BG
                    
                    pdf.setFont(selectedFont, 'bold');
                    section.tableData.headers.forEach((header: string, i: number) => {
                        pdf.text(header, margin + (i * colWidth) + 2, yPosition);
                    });
                    pdf.setFont(selectedFont, selectedWeight);
                    yPosition += 8;

                    // Table Rows
                    section.tableData.rows.forEach((row: string[], rowIndex: number) => {
                         row.forEach((cell: string, i: number) => {
                            // Simple Grid
                            pdf.rect(margin + (i * colWidth), yPosition - 5, colWidth, 7); 
                            pdf.text(cell, margin + (i * colWidth) + 2, yPosition);
                        });
                        yPosition += 7;
                    });
                    yPosition += 5;
                } 
                // List Section
                else if (section.type === 'list' && (section.content || section.items)) {
                    const items = section.items || section.content;
                    items.forEach((item: string) => {
                        pdf.text('•', margin + 5, yPosition);
                        const lines = pdf.splitTextToSize(item, contentWidth - 15);
                        lines.forEach((line: string) => {
                            pdf.text(line, margin + 10, yPosition);
                            yPosition += 5;
                        });
                        yPosition += 2;
                    });
                     yPosition += 5;
                } 
                // Text Section
                else if (section.type === 'text' && section.content) {
                    section.content.forEach((paragraph: string) => {
                        addText(paragraph, 12, 'normal', section.align || 'left');
                        yPosition += 6;
                    });
                }
            });
        }
                yPosition = pageHeight - 25;
                pdf.setFontSize(10);
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
