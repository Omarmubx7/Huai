import { projectId, publicAnonKey } from '/utils/supabase/info';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-2063e5bc`;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${publicAnonKey}`,
};

export interface Patient {
  id: string;
  name: string;
  age: number;
  condition: 'diabetes' | 'hypertension';
  medications: string[];
  createdAt: string;
  lastReading: any;
  lastReadingTime: string | null;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: string;
}

export interface Reading {
  id: string;
  patientId: string;
  value: any;
  timestamp: string;
  timeOfReading: string;
}

// ==================== PATIENTS API ====================

export const api = {
  patients: {
    getAll: async (): Promise<Patient[]> => {
      const response = await fetch(`${BASE_URL}/patients`, { headers });
      const data = await response.json();
      return data.success ? data.data : [];
    },

    getById: async (id: string): Promise<Patient | null> => {
      const response = await fetch(`${BASE_URL}/patients/${id}`, { headers });
      const data = await response.json();
      return data.success ? data.data : null;
    },

    create: async (patient: Partial<Patient>): Promise<Patient> => {
      const response = await fetch(`${BASE_URL}/patients`, {
        method: 'POST',
        headers,
        body: JSON.stringify(patient),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    },

    update: async (id: string, updates: Partial<Patient>): Promise<Patient> => {
      const response = await fetch(`${BASE_URL}/patients/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    },

    delete: async (id: string): Promise<void> => {
      const response = await fetch(`${BASE_URL}/patients/${id}`, {
        method: 'DELETE',
        headers,
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
    },
  },

  readings: {
    getByPatient: async (patientId: string): Promise<Reading[]> => {
      const response = await fetch(`${BASE_URL}/readings/${patientId}`, { headers });
      const data = await response.json();
      return data.success ? data.data : [];
    },

    add: async (patientId: string, reading: any): Promise<Reading> => {
      const response = await fetch(`${BASE_URL}/readings/${patientId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(reading),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
  },

  chat: {
    getHistory: async (patientId: string): Promise<Message[]> => {
      const response = await fetch(`${BASE_URL}/chat/${patientId}`, { headers });
      const data = await response.json();
      return data.success ? data.data : [];
    },

    sendMessage: async (patientId: string, message: string): Promise<{ userMessage: Message; aiMessage: Message }> => {
      const response = await fetch(`${BASE_URL}/chat/${patientId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
  },

  stats: {
    get: async (): Promise<any> => {
      const response = await fetch(`${BASE_URL}/stats`, { headers });
      const data = await response.json();
      return data.success ? data.data : null;
    },
  },
};
