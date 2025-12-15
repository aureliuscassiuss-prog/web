import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import Groq from 'groq-sdk';
import { jsPDF } from 'jspdf';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY
});

interface DocumentContent {
    type: 'certificate' | 'invoice' | 'letter' | 'notice' | 'report' | 'form' | 'general';
    title: string;
    sections: Array<{
        heading?: string;
        content: string[];
        type?: 'paragraph' | 'list' | 'table';
        tableData?: { headers: string[], rows: string[][] };
    }>;
    metadata?: {
        date?: string;
        author?: string;
        recipient?: string;
        additionalInfo?: Record<string, string>;
    };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    let userId: string;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        userId = decoded.userId;
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }

    try {
        const { prompt } = req.body;

        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ message: 'Invalid prompt' });
        }

        // Step 1: Use AI to generate detailed document specification
        const systemPrompt = `You are a professional document content creator specializing in creating CONCISE, SINGLE-PAGE documents with strict INDIAN FORMATTING.

CRITICAL RULES:
1. Content MUST FIT ON ONE PAGE.
2. Use INDIAN FORMATTING:
   - Dates: DD/MM/YYYY format
   - Use Indian names (e.g., Rajesh Kumar), cities (Mumbai, Delhi), ₹ currency
3. DETECT DOCUMENT TYPE: "letter" or "application" vs "certificate" vs "invoice".

FOR LETTERS / APPLICATIONS (Strict Indian Format):
Structure MUST be:
1. "To," block (Principal/Manager name, School/Company name, Address)
2. Date (DD/MM/YYYY)
3. Subject: ...
4. Salutation (Respected Sir / Madam,)
5. Body (3 concise paragraphs: Intro -> Details -> Request)
6. "Thanking you,"
7. Closing (Yours obediently/sincerely) + Name + Details (Class/Roll No or ID)

Return JSON structure:
{
  "type": "letter|application|certificate|invoice|notice|report|general",
  "title": "Document Title",
  "letter_details": { // ONLY for letters/applications
    "to_block": ["To,", "The Principal", "School Name", "City"],
    "date": "15/12/2025",
    "subject": "Subject: Application for Sick Leave",
    "salutation": "Respected Sir/Madam,",
    "body_paragraphs": ["Most respectfully, I beg to state...", "Paragraph 2...", "Therefore, kindly grant me..."],
    "closing": "Thanking you,",
    "signature_block": ["Yours obediently,", "Rahul Verma", "Class X-B", "Roll No: 21"]
  },
  "sections": [ ... ], // For non-letters (certificates, invoices, etc.)
  "metadata": { ... }
}

EXAMPLE (Sick Leave Application):
{
  "type": "application",
  "title": "Sick Leave Application",
  "letter_details": {
    "to_block": ["To,", "The Principal,", "Delhi Public School,", "R.K. Puram, New Delhi"],
    "date": "15/12/2025",
    "subject": "Subject: Application for Sick Leave due to fever",
    "salutation": "Respected Sir/Madam,",
    "body_paragraphs": [
      "Most respectfully, I beg to state that I am a student of Class X-B of your school. I have been suffering from high fever since last night, and the doctor has advised me complete rest for two days.",
      "Therefore, I am unable to attend school from 15/12/2025 to 16/12/2025.",
      "Kindly grant me leave for these two days. I shall be highly obliged to you."
    ],
    "closing": "Thanking you,",
    "signature_block": ["Yours obediently,", "Rahul Verma", "Class: X-B", "Roll No: 42"]
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

        // Step 2: Generate PDF
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20; // Standard layout
        const contentWidth = pageWidth - (margin * 2);
        let yPosition = margin;

        const addText = (text: string, fontSize: number, fontStyle: string, align: 'left' | 'center' | 'right' = 'left', isBold: boolean = false) => {
            pdf.setFontSize(fontSize);
            pdf.setFont('helvetica', isBold ? 'bold' : fontStyle);
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
                yPosition += fontSize * 0.5; // roughly appropriate leading
            });
        };

        // --- SPECIFIC LAYOUT FOR LETTERS / APPLICATIONS ---
        if (docContent.type === 'letter' || docContent.type === 'application') {
            const details = docContent.letter_details;
            if (!details) throw new Error("Missing letter details");

            pdf.setTextColor(0, 0, 0);

            // 1. To Block
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            if (details.to_block) {
                details.to_block.forEach((line: string) => {
                    pdf.text(line, margin, yPosition);
                    yPosition += 6;
                });
            }
            yPosition += 4;

            // 2. Date (Often strictly below address in Indian format)
            if (details.date) {
                pdf.text(`Date: ${details.date}`, margin, yPosition);
                yPosition += 10;
            }

            // 3. Subject
            if (details.subject) {
                pdf.setFont('helvetica', 'bold');
                // Indent subject slightly or center? Standard is often left with "Subject:" prefix
                pdf.text(details.subject, margin, yPosition);
                yPosition += 10;
            }

            // 4. Salutation
            if (details.salutation) {
                pdf.setFont('helvetica', 'normal');
                pdf.text(details.salutation, margin, yPosition);
                yPosition += 8;
            }

            // 5. Body Paragraphs
            if (details.body_paragraphs) {
                pdf.setFontSize(11);
                details.body_paragraphs.forEach((para: string) => {
                    // Indent first line of paragraph? Or standard block?
                    // Let's do standard block but clear separation
                    addText(para, 11, 'normal', 'left');
                    yPosition += 4; // Extra space between paragraphs
                });
            }
            yPosition += 8;

            // 6. "Thanking you"
            if (details.closing) {
                pdf.text(details.closing, margin, yPosition);
                yPosition += 10;
            }

            // 7. Signature Block (Yours obediently...)
            // Ideally aligned to the right for applications often, or left.
            // Let's align RIGHT for "Student Applications" look (like the image) but left is also fine.
            // Let's check typical image 1: SICK LEAVE -> Right aligned signature.
            // Image 2: OFFICE -> Left aligned.
            // Let's use Right alignment if it looks like a school application (contains "class" or "roll"), else Left.
            const isSchoolApp = JSON.stringify(details.signature_block).toLowerCase().includes('class') ||
                JSON.stringify(details.signature_block).toLowerCase().includes('roll');

            const sigAlign = isSchoolApp ? 'right' : 'left';

            if (details.signature_block) {
                details.signature_block.forEach((line: string) => {
                    if (sigAlign === 'right') {
                        pdf.text(line, pageWidth - margin - 10, yPosition, { align: 'right' });
                    } else {
                        pdf.text(line, margin, yPosition);
                    }
                    yPosition += 6;
                });
            }

        } else {
            // --- GENERIC LAYOUT FOR CERTIFICATES, INVOICES, ETC. (PREVIOUS LOGIC) ---

            // Minimal styling
            if (docContent.type === 'certificate') {
                pdf.setDrawColor(0, 0, 0);
                pdf.setLineWidth(0.8);
                pdf.rect(15, 15, pageWidth - 30, pageHeight - 30);
                yPosition = 40;
            }

            pdf.setTextColor(0, 0, 0);

            // Title
            addText(docContent.title, docContent.type === 'certificate' ? 22 : 18, 'bold', 'center', true);
            yPosition += 10;

            // Sections
            if (docContent.sections) {
                docContent.sections.forEach((section: any) => {
                    if (section.heading) {
                        yPosition += 4;
                        addText(section.heading, 12, 'bold', 'left', true);
                        yPosition += 3;
                    }

                    if (section.type === 'table' && section.tableData) {
                        // Simple table with black headers
                        yPosition += 3;
                        const colWidth = contentWidth / section.tableData.headers.length;

                        // Headers - black background, white text
                        pdf.setFillColor(0, 0, 0);
                        pdf.setTextColor(255, 255, 255);
                        section.tableData.headers.forEach((header: string, i: number) => {
                            pdf.rect(margin + (i * colWidth), yPosition, colWidth, 7, 'F');
                            pdf.setFontSize(10);
                            pdf.text(header, margin + (i * colWidth) + 2, yPosition + 5);
                        });
                        yPosition += 7;

                        // Rows
                        pdf.setTextColor(0, 0, 0);
                        section.tableData.rows.forEach((row: string[]) => {
                            row.forEach((cell: string, i: number) => {
                                pdf.rect(margin + (i * colWidth), yPosition, colWidth, 6);
                                pdf.setFontSize(9);
                                pdf.text(cell, margin + (i * colWidth) + 2, yPosition + 4);
                            });
                            yPosition += 6;
                        });
                        yPosition += 3;
                    } else if (section.type === 'list') {
                        section.content.forEach((item: string) => {
                            pdf.text('•', margin, yPosition);
                            addText(item, 10, 'normal', 'left');
                            yPosition += 1.5;
                        });
                    } else {
                        // Paragraphs
                        section.content.forEach((paragraph: string) => {
                            const align = docContent.type === 'certificate' ? 'center' : 'left';
                            const fontSize = docContent.type === 'certificate' ? 12 : 10;
                            addText(paragraph, fontSize, 'normal', align);
                            yPosition += docContent.type === 'certificate' ? 4 : 3;
                        });
                    }
                });
            }

            // Metadata
            if (docContent.metadata) {
                yPosition = pageHeight - 30;
                pdf.setFontSize(9);
                if (docContent.metadata.date) pdf.text(`Date: ${docContent.metadata.date}`, margin, yPosition);
                // Page numbers
                if (docContent.type !== 'certificate') {
                    const pageCount = pdf.getNumberOfPages();
                    for (let i = 1; i <= pageCount; i++) {
                        pdf.setPage(i);
                        pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
                    }
                }
            }
        }

        // Output
        const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="generated_document.pdf"`);
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
