import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Patient, api } from '../utils/api';
import { useAuth } from './AuthContext';

const SAVED_PATIENT_KEY = 'health_app_current_patient_id';

interface PatientContextType {
  currentPatient: Patient | null;
  setCurrentPatient: (patient: Patient | null) => void;
  updateCurrentPatient: (updates: Partial<Patient>) => void;
  patients: Patient[];
  refreshPatients: () => Promise<void>;
  loading: boolean;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentPatient, setCurrentPatientState] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const savedIdRef = useRef<string | null>(localStorage.getItem(SAVED_PATIENT_KEY));

  const setCurrentPatient = (patient: Patient | null) => {
    setCurrentPatientState(patient);
    if (patient) {
      savedIdRef.current = patient.id;
      localStorage.setItem(SAVED_PATIENT_KEY, patient.id);
    } else {
      savedIdRef.current = null;
      localStorage.removeItem(SAVED_PATIENT_KEY);
    }
  };

  const updateCurrentPatient = (updates: Partial<Patient>) => {
    setCurrentPatientState(prev => prev ? { ...prev, ...updates } : null);
    setPatients(prev =>
      prev.map(p => (p.id === savedIdRef.current ? { ...p, ...updates } : p))
    );
  };

  const refreshPatients = async () => {
    if (!user) {
      setPatients([]);
      setCurrentPatientState(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await api.patients.getAll();
      setPatients(data);

      const savedId = savedIdRef.current || localStorage.getItem(SAVED_PATIENT_KEY);
      if (savedId) {
        const found = data.find(p => p.id === savedId);
        if (found) {
          setCurrentPatientState(found);
          savedIdRef.current = found.id;
        } else {
          localStorage.removeItem(SAVED_PATIENT_KEY);
          savedIdRef.current = null;
          setCurrentPatientState(null);
        }
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch patients when user changes (login/logout)
  useEffect(() => {
    if (user) {
      refreshPatients();
    } else {
      // Clear everything on logout
      setPatients([]);
      setCurrentPatientState(null);
      savedIdRef.current = null;
      localStorage.removeItem(SAVED_PATIENT_KEY);
      setLoading(false);
    }
  }, [user?.id]);

  return (
    <PatientContext.Provider value={{ currentPatient, setCurrentPatient, updateCurrentPatient, patients, refreshPatients, loading }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient() {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatient must be used within PatientProvider');
  }
  return context;
}
