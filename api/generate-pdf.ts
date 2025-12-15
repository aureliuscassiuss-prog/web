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
        const systemPrompt = `You are a professional document content creator specializing in creating CONCISE, SINGLE-PAGE documents with Indian formatting.

CRITICAL RULES:
1. Content MUST FIT ON ONE PAGE - keep it concise and to the point
2. Use INDIAN FORMATTING:
   - Dates: DD/MM/YYYY format (e.g., 15/12/2025)
   - Use Indian names (e.g., Rajesh Kumar, Priya Sharma, Amit Patel)
   - Use Indian cities/addresses (e.g., Mumbai, Delhi, Bangalore)
   - Use ₹ symbol for currency
3. Keep content BRIEF but PROFESSIONAL - no lengthy paragraphs
4. Use REALISTIC data - no placeholders like "Lorem ipsum" or "Company Name Here"
5. Make it PRINT-READY and PROFESSIONAL

Return a JSON object with this structure:
{
  "type": "certificate|invoice|letter|notice|report|form|general",
  "title": "Document Title",
  "sections": [
    {
      "heading": "Section Heading (optional, keep short)",
      "content": ["Brief point 1", "Brief point 2"],
      "type": "paragraph|list|table",
      "tableData": {"headers": ["Col1", "Col2"], "rows": [["data1", "data2"]]} (only if type is table, max 5 rows)
    }
  ],
  "metadata": {
    "date": "DD/MM/YYYY format",
    "author": "Author name",
    "recipient": "Recipient name"
  }
}

EXAMPLE for "Certificate of completion for web development course":
{
  "type": "certificate",
  "title": "Certificate of Completion",
  "sections": [
    {
      "content": ["This is to certify that", "Rahul Verma", "has successfully completed", "Web Development Bootcamp", "December 2024"]
    }
  ],
  "metadata": {
    "date": "15/12/2024",
    "recipient": "Rahul Verma",
    "author": "Tech Institute India"
  }
}

Return ONLY valid JSON, no markdown formatting.`;

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

        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/i);
        const cleanResponse = jsonMatch ? jsonMatch[1].trim() : aiResponse.trim();

        const docContent: DocumentContent = JSON.parse(cleanResponse);

        // Step 2: Generate PDF using jsPDF
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 25;
        const contentWidth = pageWidth - (margin * 2);
        let yPosition = margin;

        // Helper function to add text with word wrapping
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
                if (align === 'center') {
                    xPosition = pageWidth / 2;
                } else if (align === 'right') {
                    xPosition = pageWidth - margin;
                }

                pdf.text(line, xPosition, yPosition, { align });
                yPosition += fontSize * 0.5;
            });
        };

        // Add minimal professional styling
        if (docContent.type === 'certificate') {
            // Simple black border for certificates only
            pdf.setDrawColor(0, 0, 0);
            pdf.setLineWidth(0.8);
            pdf.rect(20, 20, pageWidth - 40, pageHeight - 40);
            yPosition = 45;
        }

        // Professional black text only (no colors)
        pdf.setTextColor(0, 0, 0);

        // Add title
        addText(docContent.title, docContent.type === 'certificate' ? 20 : 18, 'bold', 'center', true);
        yPosition += docContent.type === 'certificate' ? 8 : 5;

        // Keep text black throughout

        // Add sections
        docContent.sections.forEach((section, index) => {
            // Add heading if exists
            if (section.heading) {
                yPosition += 3;
                addText(section.heading, 12, 'bold', 'left', true);
                yPosition += 2;
            }

            // Add content based on type
            if (section.type === 'table' && section.tableData) {
                // Simple table with black headers
                yPosition += 3;
                const colWidth = contentWidth / section.tableData.headers.length;

                // Headers - black background, white text
                pdf.setFillColor(0, 0, 0);
                pdf.setTextColor(255, 255, 255);
                section.tableData.headers.forEach((header, i) => {
                    pdf.rect(margin + (i * colWidth), yPosition, colWidth, 7, 'F');
                    pdf.setFontSize(10);
                    pdf.text(header, margin + (i * colWidth) + 2, yPosition + 5);
                });
                yPosition += 7;

                // Rows
                pdf.setTextColor(0, 0, 0);
                section.tableData.rows.forEach((row) => {
                    row.forEach((cell, i) => {
                        pdf.rect(margin + (i * colWidth), yPosition, colWidth, 6);
                        pdf.setFontSize(9);
                        pdf.text(cell, margin + (i * colWidth) + 2, yPosition + 4);
                    });
                    yPosition += 6;
                });
                yPosition += 3;
            } else if (section.type === 'list') {
                // Bullet list
                section.content.forEach((item) => {
                    pdf.text('•', margin, yPosition);
                    addText(item, 10, 'normal', 'left');
                    yPosition += 1.5;
                });
            } else {
                // Paragraphs (default)
                section.content.forEach((paragraph) => {
                    const align = docContent.type === 'certificate' ? 'center' : 'left';
                    const fontSize = docContent.type === 'certificate' ? 12 : 10;
                    addText(paragraph, fontSize, 'normal', align);
                    yPosition += docContent.type === 'certificate' ? 3 : 2;
                });
            }
        });

        // Add metadata/footer
        if (docContent.metadata) {
            yPosition = pageHeight - 30;

            if (docContent.metadata.date) {
                addText(`Date: ${docContent.metadata.date}`, 10, 'normal', 'left');
            }

            if (docContent.metadata.author && docContent.type !== 'certificate') {
                yPosition += 8;
                addText(`From: ${docContent.metadata.author}`, 10, 'normal', 'left');
            }
        }

        // Add page numbers (except for certificates)
        if (docContent.type !== 'certificate') {
            const pageCount = pdf.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                pdf.setPage(i);
                pdf.setFontSize(9);
                pdf.setTextColor(128, 128, 128);
                pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            }
        }

        // Generate PDF buffer
        const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

        // Set headers for file download
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
