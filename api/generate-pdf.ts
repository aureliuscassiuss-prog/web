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
        const systemPrompt = `You are an expert professional writer and document architect creating HIGH-QUALITY, POLISHED documents.

CRITICAL RULES:
1. **MISSING INFO POLICY (Make it Up!)**: If the user prompt lacks details (names, dates, addresses, items), **YOU MUST INVENT REALISTIC, PROFESSIONAL DATA**.
    - NEVER use placeholders like "[Name]", "[Date]", "XYZ Corp".
    - USE specific, realistic details: "Amit Kumar", "12th Oct 2025", "Greenwood High School, Bangalore", "Invoice #INV-2024-001".
    - For invoices, generate *real* items like "Web Development Services - ₹15,000".

2. **LAYOUT & FORMATTING**:
    - **"report"**: Title, Byline, Place/Date, then content.
    - **"notice"**: **MUST** result in a BOXED layout. Title "NOTICE" centered at top.
    - **"invoice"**: **MUST** use a 'table' section for items.
    - **"application"**: Strict formal block format.

3. **INDIAN FORMATTING**: DD/MM/YYYY dates, Indian names/cities (if context implies), ₹ currency.

RETURN JSON STRUCTURE:
{
  "type": "application|formal_letter|certificate|invoice|notice|report|note|general",
  "filename": "document_name.pdf",
  "title": "Document Title", // e.g. "NOTICE", "INVOICE", "Application for Leave"
  "letter_details": { 
     // OPTIONAL: Only for letters/applications/notices
     "sender_address": ["From Address Line 1", "City - PIN"], 
     "to_block": ["To,", "Recipient Name", "Company/School", "City"], 
     "date": "15/12/2025",
     "subject": "Subject: ...",
     "salutation": "Respected Sir/Madam,",
     "body_paragraphs": ["Para 1...", "Para 2..."],
     "closing": "Thanking you,",
     "signature_block": ["Yours sincerely,", "Name", "Designation"]
  },
  "sections": [
    // USE THIS FOR INVOICES, RESUMES, REPORTS, CERTIFICATES
    {
      "type": "table",
      "heading": "Item Details", 
      "tableData": {
        "headers": ["Item Description", "Qty", "Price", "Total"],
        "rows": [
           ["Service Charge", "1", "15000", "15000"],
           ["Tax (18%)", "-", "2700", "2700"]
        ]
      }
    },
    {
      "type": "text",
      "content": ["Paragraph of text..."]
    },
    {
        "type": "list",
        "content": ["Point 1", "Point 2"]
    }
  ],
  "metadata": { "date": "..." }
}

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

        // --- RENDER LOGIC ---

        // ALWAYS Render Title if present
        if (docContent.title) {
            pdf.setFontSize(18);
            pdf.setFont(selectedFont, 'bold');
            pdf.setTextColor(0, 0, 0);
            // Center title
            pdf.text(docContent.title, pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 15;
        }

        // Render Letter Details if present (regardless of type 'notice', 'letter', etc.)
        if (docContent.letter_details) {
            const details = docContent.letter_details;
            pdf.setTextColor(0, 0, 0);

            // SENDER ADDRESS (Only if present)
            if (details.sender_address) {
                pdf.setFontSize(11);
                pdf.setFont(selectedFont, 'normal');
                details.sender_address.forEach((line: string) => {
                    pdf.text(line, margin, yPosition);
                    yPosition += 5;
                });
                yPosition += 8;
            }

            // DATE
            if (details.date) {
                pdf.setFontSize(11);
                pdf.setFont(selectedFont, 'normal');
                // Align date right for some formats? Default Left for now.
                // For 'notice', date typically on left below title.
                pdf.text(docContent.type === 'formal_letter' ? `${details.date}` : `Date: ${details.date}`, margin, yPosition);
                yPosition += 10;
            }

            // TO BLOCK
            if (details.to_block) {
                pdf.setFontSize(11);
                details.to_block.forEach((line: string) => {
                    pdf.text(line, margin, yPosition);
                    yPosition += 6;
                });
                yPosition += 8;
            }

            // SUBJECT
            if (details.subject) {
                pdf.setFontSize(11);
                pdf.setFont(selectedFont, 'bold');
                pdf.text(details.subject, margin, yPosition);
                yPosition += 12;
            }

            // SALUTATION
            if (details.salutation) {
                pdf.setFont(selectedFont, 'normal');
                pdf.text(details.salutation, margin, yPosition);
                yPosition += 8;
            }

            // BODY PARAGRAPHS
            if (details.body_paragraphs) {
                pdf.setFontSize(11);
                details.body_paragraphs.forEach((para: string) => {
                    addText(para, 11, 'normal', 'justify');
                    yPosition += 6;
                });
            }
            yPosition += 4;

            // CLOSING
            if (details.closing) {
                pdf.setFont(selectedFont, 'normal');
                pdf.text(details.closing, margin, yPosition);
                yPosition += 12;
            }

            // SIGNATURE BLOCK
            // Right align for applications, left for others usually.
            const alignRight = docContent.type === 'application';

            if (details.signature_block) {
                details.signature_block.forEach((line: string) => {
                    pdf.text(line, alignRight ? pageWidth - margin : margin, yPosition, { align: alignRight ? 'right' : 'left' });
                    yPosition += 6;
                });
            }
        }

        // Render Sections (for Certificates, Reports, or extra content)
        if (docContent.sections || docContent.type === 'notice' || docContent.type === 'certificate') {

            // Special Layout: NOTICE (Boxed)
            if (docContent.type === 'notice') {
                pdf.setDrawColor(0, 0, 0); // Black border
                pdf.setLineWidth(1);
                // Draw box with padding
                const boxMargin = margin - 5;
                const boxWidth = pageWidth - (boxMargin * 2);
                const boxHeight = pageHeight - (boxMargin * 2);
                pdf.rect(boxMargin, boxMargin, boxWidth, boxHeight);

                // Ensure title is centered if it wasn't already
                if (!docContent.title) {
                    pdf.setFontSize(20);
                    pdf.setFont(selectedFont, 'bold');
                    pdf.text("NOTICE", pageWidth / 2, yPosition, { align: 'center' });
                    yPosition += 15;
                }
            }

            // Special Layout: CERTIFICATE (Border)
            if (docContent.type === 'certificate') {
                pdf.setDrawColor(0, 0, 0);
                pdf.setLineWidth(1);
                pdf.rect(15, 15, pageWidth - 30, pageHeight - 30);
                if (yPosition < 45) yPosition = 45;
            }

            if (docContent.sections) {
                docContent.sections.forEach((section: any) => {
                    if (section.heading) {
                        yPosition += 6;
                        addText(section.heading, 12, 'bold', 'left', true);
                        yPosition += 4;
                    }
                    if (section.type === 'table' && section.tableData) {
                        yPosition += 5;
                        const colWidth = contentWidth / section.tableData.headers.length;
                        pdf.setFillColor(0, 0, 0);
                        pdf.setTextColor(255, 255, 255);
                        section.tableData.headers.forEach((header: string, i: number) => {
                            pdf.rect(margin + (i * colWidth), yPosition, colWidth, 8, 'F');
                            pdf.setFontSize(10);
                            pdf.text(header, margin + (i * colWidth) + 2, yPosition + 5);
                        });
                        yPosition += 8;
                        pdf.setTextColor(0, 0, 0);
                        section.tableData.rows.forEach((row: string[]) => {
                            row.forEach((cell: string, i: number) => {
                                pdf.rect(margin + (i * colWidth), yPosition, colWidth, 7);
                                pdf.text(cell, margin + (i * colWidth) + 2, yPosition + 5);
                            });
                            yPosition += 7;
                        });
                        yPosition += 5;
                    } else if (section.type === 'list') {
                        section.content.forEach((item: string) => {
                            pdf.text('•', margin, yPosition);
                            const lines = pdf.splitTextToSize(item, contentWidth - 5);
                            lines.forEach((line: string) => {
                                pdf.text(line, margin + 5, yPosition);
                                yPosition += 5;
                            });
                            yPosition += 2;
                        });
                    } else if (section.content) {
                        section.content.forEach((paragraph: string) => {
                            addText(paragraph, 11, 'normal', docContent.type === 'certificate' ? 'center' : 'left');
                            yPosition += 6;
                        });
                    }
                });
            }

            if (docContent.metadata) {
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
