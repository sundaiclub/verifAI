
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString();
}

export const downloadSampleCSV = () => {
  // Create a sample CSV
  const sampleHeaders = ['id', 'name', 'email', 'status'];
  const sampleData = [
    ['1001', 'John Doe', 'john@example.com', 'active'],
    ['1002', 'Jane Smith', 'jane@example.com', 'active'],
    ['1003', 'Alex Johnson', 'alex@example.com', 'inactive']
  ];
  
  const csvContent = [
    sampleHeaders.join(','),
    ...sampleData.map(row => row.join(','))
  ].join('\n');
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', 'sample_verification_data.csv');
  a.click();
  URL.revokeObjectURL(url);
}
