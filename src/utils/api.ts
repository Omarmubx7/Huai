import { projectId } from '/utils/supabase/info';
import { supabase } from '../contexts/AuthContext';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/server`;

// ── Dynamic auth headers — uses the current Supabase session token ──
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new Error('NOT_AUTHENTICATED');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

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

// ==================== HELPERS FOR DB MAPPING ====================
// Postgres auto-lowercases column names. We map them internally.
const mapPatientFromDB = (dbObj: any): Patient => ({
  ...dbObj,
  lastReading: dbObj.lastreading,
  lastReadingTime: dbObj.lastreadingtime,
  createdAt: dbObj.createdat
});

const mapPatientToDB = (patient: any): any => {
  const { lastReading, lastReadingTime, createdAt, ...rest } = patient;
  return {
    ...rest,
    ...(lastReading !== undefined ? { lastreading: lastReading } : {}),
    ...(lastReadingTime !== undefined ? { lastreadingtime: lastReadingTime } : {}),
    ...(createdAt !== undefined ? { createdat: createdAt } : {})
  };
};

const mapReadingFromDB = (dbObj: any): Reading => ({
  ...dbObj,
  patientId: dbObj.patientid,
  timeOfReading: dbObj.timeofreading
});

const mapReadingToDB = (reading: any): any => {
  const { patientId, timeOfReading, ...rest } = reading;
  return {
    ...rest,
    ...(patientId !== undefined ? { patientid: patientId } : {}),
    ...(timeOfReading !== undefined ? { timeofreading: timeOfReading } : {})
  };
};

const mapMessageFromDB = (dbObj: any): Message => ({
  ...dbObj,
  patientId: dbObj.patientid
});

// ==================== PATIENTS API ====================

export const api = {
  patients: {
    getAll: async (): Promise<Patient[]> => {
      const { data, error } = await supabase.from('patients').select('*').order('createdat', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map(mapPatientFromDB);
    },

    getById: async (id: string): Promise<Patient | null> => {
      const { data, error } = await supabase.from('patients').select('*').eq('id', id).single();
      if (error) throw new Error(error.message);
      return data ? mapPatientFromDB(data) : null;
    },

    create: async (patient: Partial<Patient>): Promise<Patient> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const dbPayload = mapPatientToDB({ ...patient, user_id: user.id });
      const { data, error } = await supabase.from('patients').insert(dbPayload).select().single();
      
      if (error) throw new Error(error.message);
      return mapPatientFromDB(data);
    },

    update: async (id: string, updates: Partial<Patient>): Promise<Patient> => {
      const dbPayload = mapPatientToDB(updates);
      const { data, error } = await supabase.from('patients').update(dbPayload).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return mapPatientFromDB(data);
    },

    delete: async (id: string): Promise<void> => {
      const { error } = await supabase.from('patients').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
  },

  readings: {
    getByPatient: async (patientId: string): Promise<Reading[]> => {
      const { data, error } = await supabase.from('readings').select('*').eq('patientid', patientId).order('timestamp', { ascending: true });
      if (error) throw new Error(error.message);
      return (data || []).map(mapReadingFromDB);
    },

    add: async (patientId: string, reading: any): Promise<Reading> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const dbPayload = mapReadingToDB({
        patientId,
        user_id: user.id,
        value: reading.value,
        timeOfReading: reading.timeOfReading || "الآن"
      });

      const { data, error } = await supabase.from('readings').insert(dbPayload).select().single();
      if (error) throw new Error(error.message);

      // Update patient's last reading
      await supabase.from('patients').update({
        lastreading: reading.value,
        lastreadingtime: data.timestamp
      }).eq('id', patientId);

      return mapReadingFromDB(data);
    },
  },

  chat: {
    getHistory: async (patientId: string): Promise<Message[]> => {
      const { data, error } = await supabase.from('chat_messages').select('*').eq('patientid', patientId).order('timestamp', { ascending: true });
      if (error) throw new Error(error.message);
      return (data || []).map(mapMessageFromDB);
    },

    sendMessage: async (patientId: string, message: string): Promise<{ userMessage: Message; aiMessage: Message }> => {
      // Still use the Edge Function for sending messages to securely access the Groq API
      const headers = await getAuthHeaders();
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
      const { data, error } = await supabase.from('patients').select('*');
      if (error) throw new Error(error.message);
      
      const patients = data || [];
      const totalPatients = patients.length;
      const diabetesPatients = patients.filter((p: any) => p?.condition === "diabetes").length;
      const hypertensionPatients = patients.filter((p: any) => p?.condition === "hypertension").length;
      const needsAttention = patients.filter((p: any) => {
        if (!p?.lastReading) return true;
        if (p.condition === "diabetes") { const v = Number(p.lastReading); return !isNaN(v) && (v > 180 || v < 70); }
        return p.lastReading?.systolic > 140 || p.lastReading?.diastolic > 90;
      }).length;
      
      return { totalPatients, diabetesPatients, hypertensionPatients, needsAttention };
    },
  },

  admin: {
    migrateLegacyData: async (): Promise<string> => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${BASE_URL}/admin/migrate`, { method: "POST", headers });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.message;
    }
  }
};
