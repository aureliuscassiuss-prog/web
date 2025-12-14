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
        const systemPrompt = `You are a professional document content creator. Generate a detailed, realistic document specification based on the user's description.

IMPORTANT RULES:
1. Content must be DETAILED and REALISTIC - no placeholder text like "Lorem ipsum" or "Company Name Here"
2. Use REAL-SOUNDING names, dates, addresses, and information
3. Content should be PROFESSIONAL and POLISHED
4. Detect the document type and create appropriate content

Return a JSON object with this structure:
{
  "type": "certificate|invoice|letter|notice|report|form|general",
  "title": "Document Title",
  "sections": [
    {
      "heading": "Section Heading (optional)",
      "content": ["Paragraph 1", "Paragraph 2"],
      "type": "paragraph|list|table",
      "tableData": {"headers": ["Col1", "Col2"], "rows": [["data1", "data2"]]} (only if type is table)
    }
  ],
  "metadata": {
    "date": "Current date",
    "author": "Author name",
    "recipient": "Recipient name",
    "additionalInfo": {"key": "value"}
  }
}

EXAMPLE for "Certificate of completion for web development course":
{
  "type": "certificate",
  "title": "Certificate of Completion",
  "sections": [
    {
      "content": ["This is to certify that", "John Michael Anderson", "has successfully completed the", "Advanced Web Development Bootcamp", "Covering HTML5, CSS3, JavaScript, React, Node.js, and MongoDB", "Demonstrated exceptional skill and dedication throughout the 12-week intensive program"]
    },
    {
      "content": ["Awarded on December 15, 2025"]
    }
  ],
  "metadata": {
    "date": "December 15, 2025",
    "recipient": "John Michael Anderson",
    "author": "TechAcademy Institute"
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

        // Add decorative elements based on document type
        if (docContent.type === 'certificate') {
            // Add decorative border
            pdf.setDrawColor(41, 98, 255);
            pdf.setLineWidth(0.5);
            pdf.rect(15, 15, pageWidth - 30, pageHeight - 30);
            pdf.setLineWidth(0.2);
            pdf.rect(17, 17, pageWidth - 34, pageHeight - 34);
            yPosition = 40;
        }

        // Set color scheme based on document type
        const getAccentColor = (type: string): [number, number, number] => {
            switch (type) {
                case 'certificate': return [41, 98, 255]; // Blue
                case 'invoice': return [16, 185, 129]; // Green
                case 'letter': return [99, 102, 241]; // Indigo
                case 'notice': return [245, 158, 11]; // Amber
                case 'report': return [139, 92, 246]; // Purple
                default: return [0, 0, 0]; // Black
            }
        };

        const accentColor = getAccentColor(docContent.type);
        pdf.setTextColor(...accentColor);

        // Add title
        addText(docContent.title, 24, 'bold', 'center', true);
        yPosition += 10;

        // Reset color for body text
        pdf.setTextColor(0, 0, 0);

        // Add sections
        docContent.sections.forEach((section, index) => {
            // Add heading if exists
            if (section.heading) {
                yPosition += 5;
                pdf.setTextColor(...accentColor);
                addText(section.heading, 16, 'bold', 'left', true);
                yPosition += 3;
                pdf.setTextColor(0, 0, 0);
            }

            // Add content based on type
            if (section.type === 'table' && section.tableData) {
                // Simple table implementation
                yPosition += 5;
                const colWidth = contentWidth / section.tableData.headers.length;

                // Headers
                pdf.setFillColor(...accentColor);
                pdf.setTextColor(255, 255, 255);
                section.tableData.headers.forEach((header, i) => {
                    pdf.rect(margin + (i * colWidth), yPosition, colWidth, 8, 'F');
                    pdf.text(header, margin + (i * colWidth) + 2, yPosition + 6);
                });
                yPosition += 8;

                // Rows
                pdf.setTextColor(0, 0, 0);
                section.tableData.rows.forEach((row) => {
                    row.forEach((cell, i) => {
                        pdf.rect(margin + (i * colWidth), yPosition, colWidth, 7);
                        pdf.text(cell, margin + (i * colWidth) + 2, yPosition + 5);
                    });
                    yPosition += 7;
                });
                yPosition += 5;
            } else if (section.type === 'list') {
                // Bullet list
                section.content.forEach((item) => {
                    pdf.text('•', margin, yPosition);
                    addText(item, 11, 'normal', 'left');
                    yPosition += 2;
                });
            } else {
                // Paragraphs (default)
                section.content.forEach((paragraph) => {
                    const align = docContent.type === 'certificate' ? 'center' : 'left';
                    const fontSize = docContent.type === 'certificate' ? 14 : 11;
                    addText(paragraph, fontSize, 'normal', align);
                    yPosition += 5;
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
