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
        const { prompt } = req.body;

        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ message: 'Invalid prompt' });
        }

        // Step 1: Use AI to generate detailed document specification
        const systemPrompt = `You are an expert professional writer creating HIGH-QUALITY, POLISHED documents with strict INDIAN FORMATTING.

CRITICAL RULES:
1. **CONTENT QUALITY**: Use PRECISE, POLITE, and SOPHISTICATED language. The text should be "pleasant" and highly professional. Avoid generic phrasing.
2. **DISTINGUISH FORMATS**:
   - **"application"**: For Principal, Job, Leave (Format: "To..." block at start).
   - **"formal_letter"**: For Editor, Business, Official (Format: Sender Address -> Date -> Recipient Address).
   - **"notice"**: For Schools, Offices, Public (Format: CENTERED Title "NOTICE", Date Left, Hearing/Body, Issuer Name/Designation).
   - **"report"**: For News, events (Format: Title, Byline, Place/Date, Body).
   - **"note"**: For informal/semi-formal notes.
3. **INDIAN FORMATTING**: DD/MM/YYYY dates, Indian names/cities, ₹ currency.
4. **LENGTH**: STRICTLY ADHERE to the user's requested length. If they ask for a "long" letter, write 3-4 detailed paragraphs. If "short", keep it concise. Default to ~1 page if unspecified.
5. **FILENAME**: Generate a relevant, safe filename (e.g., "application_leave_abhi.pdf", "notice_lost_bottle.pdf"). Use underscores, lowercase, no spaces.

RETURN JSON STRUCTURE:
{
  "type": "application|formal_letter|certificate|invoice|notice|report|note|general",
  "filename": "document_name.pdf",
  "title": "Document Title",
  "letter_details": { 
    "sender_address": ["Sender Name", "Address Line 1", "City - PIN"], // Only for formal_letter
    "to_block": ["To,", "The Principal/Manager", "Institution Name", "City"], 
    "date": "15/12/2025",
    "subject": "Subject: ... (Clear & Professional)",
    "salutation": "Respected Sir/Madam,", 
    "body_paragraphs": [
      "I am writing to respectfully submit...", 
      "Paragraph 2 (Details)...", 
      "I kindly request you to..." 
    ],
    "closing": "Thanking you,",
    "signature_block": ["Yours sincerely/faithfully,", "Name", "Designation/Class"]
  },
  "sections": [ ... ], // For certificates/others
  "metadata": ...
}

EXAMPLE (Application):
{
  "type": "application",
  "filename": "application_leave_abhi.pdf",
  "title": "Application for Leave",
  "letter_details": {
    "date": "15/12/2025",
    "to_block": ["To,", "The Principal,", "DPS School,", "Delhi"],
    "subject": "Subject: Application for 2 days leave",
    "salutation": "Respected Sir,",
    "body_paragraphs": ["I am Abhi, a student of class X-B...", "..."],
    "closing": "Thanking you,",
    "signature_block": ["Yours obediently,", "Abhi", "Class X-B"]
  }
}

Return ONLY valid JSON.`;

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
        const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/i);
        const cleanResponse = jsonMatch ? jsonMatch[1].trim() : aiResponse.trim();
        const docContent = JSON.parse(cleanResponse);

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
            pdf.setFont('helvetica', isBold ? 'bold' : fontStyle);

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

        if (docContent.type === 'letter' || docContent.type === 'application' || docContent.type === 'formal_letter') {
            const details = docContent.letter_details;
            if (!details) throw new Error("Missing letter details");

            pdf.setTextColor(0, 0, 0);

            // SENDER ADDRESS (Only for Formal Letters)
            if (docContent.type === 'formal_letter' && details.sender_address) {
                pdf.setFontSize(11);
                pdf.setFont('helvetica', 'normal');
                details.sender_address.forEach((line: string) => {
                    pdf.text(line, margin, yPosition);
                    yPosition += 5;
                });
                yPosition += 8; // Space after sender address
            }

            // DATE
            if (details.date) {
                pdf.setFontSize(11);
                pdf.setFont('helvetica', 'normal'); // Normal weight for date
                pdf.text(docContent.type === 'formal_letter' ? `${details.date}` : `Date: ${details.date}`, margin, yPosition);
                yPosition += 10;
            }

            // TO BLOCK
            if (details.to_block) {
                pdf.setFontSize(11);
                // "To," line usually
                details.to_block.forEach((line: string) => {
                    pdf.text(line, margin, yPosition);
                    yPosition += 6;
                });
                yPosition += 8;
            }

            // SUBJECT
            if (details.subject) {
                pdf.setFontSize(11); // Professional size
                pdf.setFont('helvetica', 'bold');
                // Center subject for formal letters sometimes, but Left is standard modern
                pdf.text(details.subject, margin, yPosition);
                yPosition += 12;
            }

            // SALUTATION
            if (details.salutation) {
                pdf.setFont('helvetica', 'normal');
                pdf.text(details.salutation, margin, yPosition);
                yPosition += 10;
            }

            // BODY PARAGRAPHS
            if (details.body_paragraphs) {
                pdf.setFontSize(11);
                details.body_paragraphs.forEach((para: string) => {
                    // Justify approximation: Use nice spacing
                    addText(para, 11, 'normal', 'justify');
                    yPosition += 6; // Paragraph spacing
                });
            }
            yPosition += 4;

            // CLOSING ("Thanking you")
            if (details.closing) {
                pdf.setFont('helvetica', 'normal');
                pdf.text(details.closing, margin, yPosition);
                yPosition += 12;
            }

            // SIGNATURE BLOCK
            // Align Right for 'application' (User preference), Left for 'formal_letter'
            const alignRight = docContent.type === 'application' ||
                (docContent.type === 'letter' && !details.sender_address); // detailed check

            const sigX = alignRight ? pageWidth - margin - 40 : margin; // 40mm buffer for right align block

            if (details.signature_block) {
                details.signature_block.forEach((line: string) => {
                    pdf.text(line, alignRight ? pageWidth - margin : margin, yPosition, { align: alignRight ? 'right' : 'left' });
                    yPosition += 6;
                });
            }

        } else {
            // --- GENERIC LAYOUT (Certificates, etc) ---
            if (docContent.type === 'certificate') {
                pdf.setDrawColor(0, 0, 0);
                pdf.setLineWidth(1);
                pdf.rect(15, 15, pageWidth - 30, pageHeight - 30);
                yPosition = 45;
            }

            pdf.setTextColor(0, 0, 0);
            addText(docContent.title, docContent.type === 'certificate' ? 24 : 18, 'bold', 'center', true);
            yPosition += 12;

            if (docContent.sections) {
                docContent.sections.forEach((section: any) => {
                    if (section.heading) {
                        yPosition += 6;
                        addText(section.heading, 12, 'bold', 'left', true);
                        yPosition += 4;
                    }
                    if (section.type === 'table' && section.tableData) {
                        // Table logic remains same
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
                            // Fix: properly indented list item
                            const lines = pdf.splitTextToSize(item, contentWidth - 5);
                            lines.forEach((line: string) => {
                                pdf.text(line, margin + 5, yPosition);
                                yPosition += 5;
                            });
                            yPosition += 2;
                        });
                    } else {
                        section.content.forEach((paragraph: string) => {
                            addText(paragraph, docContent.type === 'certificate' ? 12 : 11, 'normal', docContent.type === 'certificate' ? 'center' : 'left');
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
