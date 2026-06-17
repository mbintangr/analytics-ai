"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { IoImageOutline, IoClose, IoDownloadOutline } from "react-icons/io5";

interface ImageGalleryProps {
  reportId: string;
}

interface ImageInfo {
  name: string;
}

export function ImageGallery({ reportId }: ImageGalleryProps) {
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!reportId) return;

    const fetchImages = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/report/${reportId}/images`);
        if (!res.ok) throw new Error("Failed to fetch generated graphs");
        const result = await res.json();
        setImages(result.images || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [reportId]);

  const handleDownload = (imgName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `/api/report/${reportId}/image?filename=${encodeURIComponent(imgName)}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = imgName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]" style={{ color: "var(--text-secondary)" }}>
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm">Loading graphs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] text-red-400 text-sm p-4 text-center">
        {error}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]" style={{ color: "var(--text-muted)" }}>
        <IoImageOutline size={48} className="mb-4 opacity-40" />
        <p className="text-sm">No graphs were generated for this project.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="mb-6">
        <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Generated Graphs</h3>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          {images.length} graph{images.length !== 1 && "s"} generated during analysis
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-8">
        {images.map((img, idx) => {
          const imgUrl = `/api/report/${reportId}/image?filename=${encodeURIComponent(img.name)}`;
          const displayName = img.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ").replace(/-/g, " ");
          
          return (
            <div
              key={idx}
              className="group flex flex-col rounded-xl overflow-hidden border backdrop-blur-sm cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
              style={{ borderColor: "var(--surface-border)", background: "var(--surface-card)" }}
              onClick={() => setSelectedImage(img.name)}
            >
              <div className="w-full h-48 bg-black/5 flex items-center justify-center p-2 relative overflow-hidden" style={{ background: "var(--surface-deep)" }}>
                <img 
                  src={imgUrl} 
                  alt={displayName} 
                  className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105" 
                  loading="lazy"
                />
                
                <button 
                  onClick={(e) => handleDownload(img.name, e)}
                  className="absolute top-2 right-2 p-2 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary"
                  title="Download Image"
                >
                  <IoDownloadOutline size={18} />
                </button>
              </div>
              <div className="p-3 border-t flex items-center justify-between" style={{ borderColor: "var(--surface-border)" }}>
                <p className="text-xs font-medium truncate capitalize" style={{ color: "var(--text-primary)" }} title={displayName}>
                  {displayName}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {mounted && selectedImage && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 backdrop-blur-md animate-in fade-in"
          style={{ background: "rgba(0,0,0,0.8)" }}
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <IoClose size={24} />
          </button>
          
          <div 
            className="relative max-w-full max-h-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={`/api/report/${reportId}/image?filename=${encodeURIComponent(selectedImage)}`} 
              alt={selectedImage} 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" 
            />
            
            <div className="mt-4 flex items-center gap-4">
              <span className="text-white text-sm font-medium">
                {selectedImage.replace(/\.[^/.]+$/, "").replace(/_/g, " ").replace(/-/g, " ")}
              </span>
              <button 
                onClick={(e) => handleDownload(selectedImage, e)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <IoDownloadOutline size={16} />
                Download
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
