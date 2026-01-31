export interface TemplateField {
    id: string;
    label: string;
    x: number;
    y: number;
    width: number;
    fontSize: number;
    fontWeight: number; // 100-900
    fontFamily: string;
    color: string;
    alignment: 'left' | 'center' | 'right';
    lineHeight?: number; // Multiplier, default 1.2
    type?: 'text' | 'image' | 'barcode';
    src?: string; // For images
    height?: number;
    textOffsetX?: number;
    textOffsetY?: number;
    locked?: boolean;
    defaultValue?: string; // Example/placeholder content to guide users
    side?: 'front' | 'back'; // Which side of the card this field belongs to (default: 'front')
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

export interface Template {
    id: string;
    name: string;
    imageUrl: string;
    backImageUrl?: string; // Background for the reverse side
    hasBackSide?: boolean; // Whether the template has a reverse side enabled
    fields: TemplateField[];
    showHinglishConverter?: boolean; // Controls if converter toggle appears in public view
}

export interface CustomFont {
    id: string;
    name: string;
    dataUrl: string; // Base64 woff/ttf
}

// Client-side storage using localStorage
export function getTemplates(): Template[] {
    if (typeof window === 'undefined') return [];
    try {
        const data = localStorage.getItem('templates');
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error reading templates:', error);
        return [];
    }
}

export function saveTemplates(templates: Template[]): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem('templates', JSON.stringify(templates));
    } catch (error) {
        console.error('Error saving templates:', error);
    }
}

export function addTemplate(template: Template): void {
    const templates = getTemplates();
    templates.push(template);
    saveTemplates(templates);
}

export function updateTemplate(updatedTemplate: Template): void {
    const templates = getTemplates();
    const index = templates.findIndex(t => t.id === updatedTemplate.id);
    if (index !== -1) {
        templates[index] = updatedTemplate;
        saveTemplates(templates);
    }
}
