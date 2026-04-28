import { useRef, useState } from "react";
import { X, Printer, Download, Image as ImageIcon } from "lucide-react";
import { formatCurrency } from "../utils/financeCalculations";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { Database } from "../../lib/database.types";

type NumanieOrder = Database["public"]["Tables"]["numanie_orders"]["Row"];

interface NumanieInvoiceModalProps {
  order: NumanieOrder;
  onClose: () => void;
}

export function NumanieInvoiceModal({ order, onClose }: NumanieInvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [receiptWidth, setReceiptWidth] = useState<"58mm" | "80mm">("80mm");
  const [isPrinting, setIsPrinting] = useState(false);

  // Pixel width for receipt sizes (at 96 DPI)
  const widthInPixels = receiptWidth === "58mm" ? 220 : 302;

  const handlePrint = async () => {
    if (!invoiceRef.current || isPrinting) return;
    setIsPrinting(true);
    
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL("image/png");
      
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice - ${order.id}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                display: flex;
                justify-content: center;
                align-items: flex-start;
                min-height: 100vh;
                background: #fff;
                padding: 10px;
              }
              img {
                max-width: 100%;
                height: auto;
              }
              @media print {
                @page {
                  size: ${receiptWidth};
                  margin: 0;
                }
                body {
                  margin: 0;
                  padding: 0;
                }
                img {
                  width: 100%;
                  page-break-inside: avoid;
                }
              }
            </style>
          </head>
          <body>
            <img src="${imgData}" alt="Invoice" />
            <script>
              window.onload = function() {
                setTimeout(() => {
                  window.print();
                  window.onafterprint = function() {
                    window.close();
                  };
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
    } catch (error) {
      console.error("Error generating print image:", error);
      toast.error("Gagal membuat preview print. Silakan coba lagi.");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadImage = async (format: "png" | "jpg" = "png") => {
    if (!invoiceRef.current || isPrinting) return;
    setIsPrinting(true);

    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const mimeType = format === "png" ? "image/png" : "image/jpeg";
      const imgData = canvas.toDataURL(mimeType, 0.92);
      
      const link = document.createElement("a");
      link.download = `Receipt_Numanie_${order.id}_${Date.now()}.${format}`;
      link.href = imgData;
      link.click();
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Gagal membuat gambar. Silakan coba lagi.");
    } finally {
      setIsPrinting(false);
    }
  };

  const invoiceDate = new Date(order.created_at).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const invoiceTime = new Date(order.created_at).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Dashed line divider
  const dashedLine = "- ".repeat(30);

  // Asserting order.items as an array of objects
  const orderItems = Array.isArray(order.items) ? (order.items as any[]) : [];
  const totalItemQuantity = orderItems.reduce((acc, curr) => acc + (curr.quantity || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative bg-gray-100 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header Actions */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex flex-col gap-3 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              Receipt Numanie
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Size selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Ukuran:</span>
            <button
              onClick={() => setReceiptWidth("58mm")}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                receiptWidth === "58mm"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              58mm
            </button>
            <button
              onClick={() => setReceiptWidth("80mm")}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                receiptWidth === "80mm"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              80mm
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? "Memproses..." : "Print"}</span>
            </button>
            <button
              onClick={() => handleDownloadImage("png")}
              disabled={isPrinting}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>PNG</span>
            </button>
            <button
              onClick={() => handleDownloadImage("jpg")}
              disabled={isPrinting}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ImageIcon className="w-4 h-4" />
              <span>JPG</span>
            </button>
          </div>
        </div>

        {/* Receipt Preview Container */}
        <div className="p-4 flex justify-center">
          {/* Thermal Receipt */}
          <div
            ref={invoiceRef}
            style={{
              width: `${widthInPixels}px`,
              backgroundColor: '#ffffff',
              color: '#000000',
              fontFamily: 'Courier New, monospace',
              fontSize: '11px',
              lineHeight: '1.4',
              padding: '16px 8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Header - Store Name */}
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px' }}>
                INVOICE NUMANIE PIZZA
              </div>
              <div style={{ fontSize: '9px', marginTop: '4px' }}>
                via SiAnter Delivery
              </div>
            </div>

            {/* Divider */}
            <div style={{ fontSize: '8px', overflow: 'hidden', marginBottom: '8px' }}>
              {dashedLine}
            </div>

            {/* Order Info */}
            <div style={{ marginBottom: '12px', fontSize: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Order ID:</span>
                <span style={{ fontWeight: 'bold' }}>#{order.id.slice(0, 11)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Tanggal:</span>
                <span>{invoiceDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Waktu:</span>
                <span>{invoiceTime}</span>
              </div>
            </div>

            {/* Divider */}
            <div style={{ fontSize: '8px', overflow: 'hidden', marginBottom: '8px' }}>
              {dashedLine}
            </div>

            {/* Customer Info */}
            <div style={{ marginBottom: '8px', fontSize: '10px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>PELANGGAN:</div>
              <div>{order.customer_name}</div>
              <div>{order.customer_phone}</div>
              <div style={{ fontSize: '9px' }}>{order.customer_village}</div>
            </div>

            {/* Divider */}
            <div style={{ fontSize: '8px', overflow: 'hidden', marginBottom: '8px' }}>
              {dashedLine}
            </div>

            {/* Items List */}
            <div style={{ marginBottom: '8px' }}>
              {orderItems.length > 0 ? (
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '6px' }}>PESANAN:</div>
                  {orderItems.map((item, idx) => {
                    const itemTotal = item.item_total || (item.price * item.quantity);
                    
                    return (
                      <div key={idx} style={{ marginBottom: '6px', fontSize: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ flex: 1, wordBreak: 'break-word' }}>
                            {item.name} {item.is_custom && '(Custom)'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                          <span style={{ paddingLeft: '4px' }}>
                            {formatCurrency(item.price)} x{item.quantity}
                          </span>
                          <span style={{ fontWeight: 'bold' }}>
                            {formatCurrency(itemTotal)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {/* Items subtotal */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '6px', paddingTop: '4px', borderTop: '1px dashed #ccc' }}>
                    <span>Subtotal ({totalItemQuantity} item):</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {formatCurrency(order.subtotal || 0)}
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '2px' }}>
                    <span>Subtotal (items):</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {formatCurrency(order.subtotal || 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={{ fontSize: '8px', overflow: 'hidden', marginBottom: '8px' }}>
              {dashedLine}
            </div>

            {/* Totals */}
            <div style={{ marginBottom: '8px', fontSize: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Subtotal Pizza:</span>
                <span>{formatCurrency(order.subtotal || 0)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Ongkir ({order.zone} · {order.distance}km):</span>
                <span>{formatCurrency(order.delivery_fee || 0)}</span>
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '2px solid #000', marginBottom: '8px' }}></div>

            {/* Grand Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginBottom: '12px' }}>
              <span>TOTAL (COD):</span>
              <span>
                {formatCurrency(order.total || 0)}
              </span>
            </div>

            {/* Divider */}
            <div style={{ fontSize: '8px', overflow: 'hidden', marginBottom: '8px' }}>
              {dashedLine}
            </div>

            <div style={{ fontSize: '9px', textAlign: 'center', marginBottom: '8px' }}>
              <div>Terima kasih atas pesanannya!</div>
              <div style={{ marginTop: '4px' }}>Numanie Pizza</div>
            </div>

            {/* Divider */}
            <div style={{ fontSize: '8px', overflow: 'hidden', marginBottom: '8px' }}>
              {dashedLine}
            </div>

            {/* Footer */}
            <div style={{ fontSize: '8px', textAlign: 'center' }}>
              <div>Dokumen elektronik SiAnter</div>
              <div style={{ marginTop: '4px' }}>
                {new Date().toLocaleString("id-ID")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
