
export interface ScanResult {
  id: string;
  timestamp: number;
  imageUrl: string;
  plateNumber: string;
  region: string;
  vehicle: {
    make: string;
    model: string;
    color: string;
    type: string;
  };
  confidence: string;
}

export interface RecognitionData {
  plate_number: string;
  region: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_color: string;
  vehicle_type: string;
  confidence_score: string;
}
