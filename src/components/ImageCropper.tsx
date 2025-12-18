import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

import { X, Check } from 'lucide-react';
import { getCroppedImg } from '../lib/cropImage'; // We need to create this util

interface ImageCropperProps {
    imageSrc: string;
    aspectStats?: number; // e.g., 16/9
    onCropComplete: (croppedImageBlob: Blob) => void;
    onCancel: () => void;
}

export default function ImageCropper({ imageSrc, aspectStats = 16 / 9, onCropComplete, onCancel }: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const showCroppedImage = useCallback(async () => {
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (croppedImage) {
                onCropComplete(croppedImage);
            }
        } catch (e) {
            console.error(e);
        }
    }, [imageSrc, croppedAreaPixels, onCropComplete]);

    return (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center p-4">
            <div className="relative w-full h-[60vh] max-w-4xl bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspectStats}
                    onCropChange={onCropChange}
                    onCropComplete={onCropCompleteHandler}
                    onZoomChange={onZoomChange}
                />
            </div>

            <div className="mt-6 w-full max-w-md space-y-4">
                <div className="flex items-center gap-4">
                    <span className="text-white text-sm font-medium">Zoom</span>
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>

                <div className="flex gap-4 justify-center">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2.5 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors flex items-center gap-2"
                    >
                        <X size={18} /> Cancel
                    </button>
                    <button
                        onClick={showCroppedImage}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        <Check size={18} /> Apply Crop
                    </button>
                </div>
            </div>
        </div>
    );
}
