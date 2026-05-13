-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create patients table
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER,
    condition TEXT CHECK (condition IN ('diabetes', 'hypertension')),
    medications JSONB DEFAULT '[]'::jsonb,
    lastReading JSONB,
    lastReadingTime TIMESTAMPTZ,
    createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Policies for patients
CREATE POLICY "Users can view their own patients" ON public.patients
FOR SELECT USING (auth.uid() = user_id OR (SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') OR (SELECT (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'));

CREATE POLICY "Users can insert their own patients" ON public.patients
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patients" ON public.patients
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own patients" ON public.patients
FOR DELETE USING (auth.uid() = user_id);


-- 2. Create readings table
CREATE TABLE IF NOT EXISTS public.readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    patientId UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    value JSONB NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    timeOfReading TEXT
);

ALTER TABLE public.readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own readings" ON public.readings
FOR SELECT USING (auth.uid() = user_id OR (SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') OR (SELECT (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'));

CREATE POLICY "Users can insert their own readings" ON public.readings
FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 3. Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    patientId UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    sender TEXT CHECK (sender IN ('user', 'assistant')),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat_messages" ON public.chat_messages
FOR SELECT USING (auth.uid() = user_id OR (SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') OR (SELECT (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'));

CREATE POLICY "Users can insert their own chat_messages" ON public.chat_messages
FOR INSERT WITH CHECK (auth.uid() = user_id);
