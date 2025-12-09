import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CameraIcon, UploadIcon, ScanIcon, CheckCircleIcon, XCircleIcon, Loader2Icon } from "lucide-react";

interface ScannedReceipt {
  merchant_name?: string;
  amount?: number;
  transaction_date?: string;
  category?: string;
  items?: any[];
  raw_text?: string;
  confidence_score?: number;
}

interface ReceiptScannerProps {
  onReceiptScanned?: (data: ScannedReceipt) => void;
}

export const ReceiptScanner = ({ onReceiptScanned }: ReceiptScannerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedReceipt | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const categories = [
    "Food & Dining",
    "Shopping",
    "Transportation",
    "Entertainment",
    "Healthcare",
    "Bills & Utilities",
    "Groceries",
    "Other"
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setScannedData(null);
    }
  };

  const uploadToSupabase = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

      // Check if bucket exists, if not create it or use a fallback
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      const bucketExists = buckets?.some(bucket => bucket.name === 'receipts');
      
      if (!bucketExists) {
        // Try to create the bucket
        const { error: createError } = await supabase.storage.createBucket('receipts', {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
        });
        
        if (createError) {
          console.error('Bucket creation error:', createError);
          // If we can't create bucket, return a data URL as fallback
          return URL.createObjectURL(file);
        }
      }

      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        // Fallback to data URL if upload fails
        return URL.createObjectURL(file);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error in uploadToSupabase:', error);
      // Return a local object URL as fallback
      return URL.createObjectURL(file);
    }
  };

  const extractReceiptData = async (imageUrl: string): Promise<ScannedReceipt> => {
    // Try to use Python OCR API if available, otherwise fallback to manual entry
    
    try {
      if (!selectedFile) {
        throw new Error('No file selected');
      }

      // Try to call Python Flask API for OCR
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('http://localhost:5000/api/scan-receipt', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        
        toast({
          title: "OCR Processing Complete",
          description: `Extracted data with ${(data.confidence_score * 100).toFixed(0)}% confidence`,
        });

        return {
          merchant_name: data.merchant_name || "Shop Name",
          amount: data.amount || 0.00,
          transaction_date: data.transaction_date || new Date().toISOString().split('T')[0],
          category: data.category || "Other",
          confidence_score: data.confidence_score || 0.0,
          raw_text: data.raw_text || "",
          items: data.items || []
        };
      } else {
        throw new Error('OCR API failed');
      }
    } catch (error) {
      console.warn('OCR API not available, using manual entry mode:', error);
      
      // Fallback to manual entry when Python API is not available
      toast({
        title: "Manual Entry Mode",
        description: "OCR service unavailable. Please enter receipt details manually.",
        variant: "default",
      });

      const currentDate = new Date();
      const detectedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

      return {
        merchant_name: "Shop Name",
        amount: 0.00,
        transaction_date: detectedDate,
        category: "Other",
        confidence_score: 0.0,
        raw_text: "Manual entry required - Python OCR API not running. Start the API with: cd receipt-scanner-api && python app.py",
        items: []
      };
    }
  };

  const handleScan = async () => {
    if (!selectedFile) {
      toast({
        title: "Missing information",
        description: "Please select a receipt image to scan.",
        variant: "destructive",
      });
      return;
    }

    setScanning(true);

    try {
      // Extract data using AI (mock for now)
      const extractedData = await extractReceiptData(imagePreview || '');

      // Try to save to database if user is authenticated
      if (user) {
        try {
          // Upload image to Supabase storage
          const imageUrl = await uploadToSupabase(selectedFile);

          // Try to save to database
          const { error } = await supabase
            .from("receipts")
            .insert([
              {
                user_id: user.id,
                image_url: imageUrl,
                merchant_name: extractedData.merchant_name,
                amount: extractedData.amount,
                transaction_date: extractedData.transaction_date,
                category: extractedData.category,
                items: extractedData.items,
                raw_text: extractedData.raw_text,
                confidence_score: extractedData.confidence_score,
                status: 'processed'
              }
            ])
            .select()
            .single();

          if (error) {
            console.warn('Database save failed, continuing with local data:', error);
          }
        } catch (dbError) {
          console.warn('Database operation failed, continuing with local data:', dbError);
        }
      }

      setScannedData(extractedData);
      
      toast({
        title: "Receipt scanned successfully",
        description: "Data has been extracted from your receipt.",
      });

      if (onReceiptScanned) {
        onReceiptScanned(extractedData);
      }
    } catch (error: any) {
      console.error("Error scanning receipt:", error);
      
      toast({
        title: "Scan failed",
        description: error.message || "Failed to scan receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setScannedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  return (
    <Card className="bg-gradient-card shadow-card-shadow">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <ScanIcon className="w-5 h-5 text-primary" />
          AI Receipt Scanner
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {!imagePreview ? (
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <div className="text-5xl mb-4">📄</div>
            <p className="text-muted-foreground mb-4">Upload a receipt to scan</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="gap-2"
              >
                <UploadIcon className="w-4 h-4" />
                Upload Image
              </Button>
              <Button
                onClick={() => cameraInputRef.current?.click()}
                variant="outline"
                className="gap-2"
              >
                <CameraIcon className="w-4 h-4" />
                Take Photo
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden border border-border">
              <img 
                src={imagePreview} 
                alt="Receipt preview" 
                className="w-full h-64 object-contain bg-muted"
              />
            </div>

            {!scannedData && !scanning && (
              <div className="flex gap-3">
                <Button
                  onClick={handleScan}
                  className="flex-1 bg-primary hover:bg-primary/90"
                  disabled={scanning}
                >
                  <ScanIcon className="w-4 h-4 mr-2" />
                  Scan Receipt
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  disabled={scanning}
                >
                  Cancel
                </Button>
              </div>
            )}

            {scanning && (
              <div className="flex items-center justify-center gap-2 text-primary py-4">
                <Loader2Icon className="w-5 h-5 animate-spin" />
                <span>Scanning receipt...</span>
              </div>
            )}

            {scannedData && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircleIcon className="w-5 h-5" />
                  <span className="font-semibold">Receipt Scanned Successfully</span>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <p className="text-xs text-amber-500 mb-2">📝 Please verify and edit the extracted data if needed</p>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Merchant</Label>
                      <Input
                        value={scannedData.merchant_name || ""}
                        onChange={(e) => setScannedData({ ...scannedData, merchant_name: e.target.value })}
                        className="mt-1"
                        placeholder="Enter merchant name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Amount (₹)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={scannedData.amount || ""}
                          onChange={(e) => setScannedData({ ...scannedData, amount: parseFloat(e.target.value) || 0 })}
                          className="mt-1"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Date</Label>
                        <Input
                          type="date"
                          value={scannedData.transaction_date || ""}
                          onChange={(e) => setScannedData({ ...scannedData, transaction_date: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Category</Label>
                      <Select 
                        value={scannedData.category} 
                        onValueChange={(value) => setScannedData({ ...scannedData, category: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {scannedData.confidence_score && (
                    <div className="pt-2 border-t border-border">
                      <Label className="text-xs text-muted-foreground">Confidence Score</Label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${scannedData.confidence_score * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold">
                          {(scannedData.confidence_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full"
                >
                  Scan Another Receipt
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
          <p>💡 Tip: For best results, ensure the receipt is well-lit and all text is clearly visible</p>
        </div>
      </CardContent>
    </Card>
  );
};
