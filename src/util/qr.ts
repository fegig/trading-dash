/**
 * Downloads an SVG element as a PNG image
 * @param svgElement - The SVG element to download
 * @param filename - The name of the downloaded file
 */
export const downloadQRCode = (svgElement: SVGSVGElement | null, filename: string): void => {
  if (!svgElement) return;
  
  // Create a canvas element
  const canvas = document.createElement('canvas');
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const img = new Image();
  
  // Create a data URL from the SVG
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  
  img.onload = () => {
    // Set canvas dimensions
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Draw white background and the image
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      // Create download link
      const downloadLink = document.createElement('a');
      downloadLink.download = filename;
      downloadLink.href = canvas.toDataURL('image/png');
      downloadLink.click();
      
      // Clean up
      URL.revokeObjectURL(url);
    }
  };
  
  img.src = url;
};
