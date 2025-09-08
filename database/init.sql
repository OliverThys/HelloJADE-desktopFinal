-- HelloJADE Database Schema
-- Version: 2.0.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create database if not exists
-- This is handled by Docker, but included for reference

-- Users table (from Active Directory/LDAP)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    hospital_id VARCHAR(50),
    permissions TEXT[],
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    hospital_id VARCHAR(50) REFERENCES hospitals(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    service_id UUID REFERENCES services(id),
    hospital_id VARCHAR(50) REFERENCES hospitals(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    hospital_id VARCHAR(50) REFERENCES hospitals(id),
    service_id UUID REFERENCES services(id),
    doctor_id UUID REFERENCES doctors(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Calls table
CREATE TABLE IF NOT EXISTS calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id),
    hospital_id VARCHAR(50) REFERENCES hospitals(id),
    phone_number VARCHAR(20) NOT NULL,
    call_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    scheduled_call_date TIMESTAMP NOT NULL,
    actual_call_date TIMESTAMP,
    call_duration INTEGER, -- in seconds
    medical_score INTEGER,
    responses JSONB,
    call_summary TEXT,
    recording_path VARCHAR(500),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Medical scores table
CREATE TABLE IF NOT EXISTS medical_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id UUID REFERENCES calls(id),
    pain_level INTEGER,
    pain_location VARCHAR(255),
    medication_compliance BOOLEAN,
    transit_normal BOOLEAN,
    transit_problem TEXT,
    mood_level INTEGER,
    mood_details TEXT,
    fever_present BOOLEAN,
    temperature DECIMAL(4,1),
    other_complaints TEXT,
    emergency_detected BOOLEAN,
    total_score INTEGER,
    score_category VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Call issues table (for improvement feedback)
CREATE TABLE IF NOT EXISTS call_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id UUID REFERENCES calls(id),
    category VARCHAR(100) NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium',
    description TEXT NOT NULL,
    steps_to_reproduce TEXT,
    user_email VARCHAR(255),
    user_agent TEXT,
    ip_address INET,
    status VARCHAR(20) DEFAULT 'open',
    resolution TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- System configuration table
CREATE TABLE IF NOT EXISTS system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_calls_patient_id ON calls(patient_id);
CREATE INDEX IF NOT EXISTS idx_calls_hospital_id ON calls(hospital_id);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(call_status);
CREATE INDEX IF NOT EXISTS idx_calls_scheduled_date ON calls(scheduled_call_date);
CREATE INDEX IF NOT EXISTS idx_calls_actual_date ON calls(actual_call_date);
CREATE INDEX IF NOT EXISTS idx_medical_scores_call_id ON medical_scores(call_id);
CREATE INDEX IF NOT EXISTS idx_medical_scores_total_score ON medical_scores(total_score);
CREATE INDEX IF NOT EXISTS idx_call_issues_call_id ON call_issues(call_id);
CREATE INDEX IF NOT EXISTS idx_call_issues_status ON call_issues(status);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- Insert default hospitals
INSERT INTO hospitals (id, name, address, phone, email) VALUES
('MONS', 'CHU de Mons', 'Avenue du Champ de Mars, 7000 Mons', '+32 65 37 21 11', 'contact@chumons.be'),
('LILLE', 'CHU de Lille', '2 Avenue Oscar Lambret, 59000 Lille', '+33 3 20 44 59 62', 'contact@chru-lille.fr'),
('TOURNAI', 'CHR de Tournai', 'Rue de l''Hôpital, 7500 Tournai', '+32 69 22 22 11', 'contact@chrtournai.be')
ON CONFLICT (id) DO NOTHING;

-- Insert default services
INSERT INTO services (name, hospital_id) VALUES
('Cardiologie', 'MONS'),
('Chirurgie', 'MONS'),
('Médecine interne', 'MONS'),
('Pneumologie', 'MONS'),
('Cardiologie', 'LILLE'),
('Chirurgie', 'LILLE'),
('Médecine interne', 'LILLE'),
('Pneumologie', 'LILLE'),
('Cardiologie', 'TOURNAI'),
('Chirurgie', 'TOURNAI'),
('Médecine interne', 'TOURNAI'),
('Pneumologie', 'TOURNAI')
ON CONFLICT DO NOTHING;

-- Insert default system configuration
INSERT INTO system_config (key, value, description, category) VALUES
('max_call_attempts', '3', 'Nombre maximum de tentatives d''appel', 'calls'),
('call_timeout', '300', 'Timeout d''appel en secondes', 'calls'),
('emergency_score_threshold', '40', 'Seuil de score pour urgence', 'medical'),
('asterisk_host', 'localhost', 'Adresse du serveur Asterisk', 'asterisk'),
('asterisk_ami_port', '5038', 'Port AMI Asterisk', 'asterisk'),
('whisper_model', 'base', 'Modèle Whisper à utiliser', 'ai'),
('ollama_model', 'llama2', 'Modèle Ollama à utiliser', 'ai'),
('rasa_endpoint', 'http://localhost:5005', 'Endpoint Rasa', 'ai')
ON CONFLICT (key) DO NOTHING;

-- Create functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON hospitals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calls_updated_at BEFORE UPDATE ON calls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate medical score category
CREATE OR REPLACE FUNCTION get_score_category(score INTEGER)
RETURNS VARCHAR(50) AS $$
BEGIN
    CASE
        WHEN score >= 80 THEN RETURN 'excellent';
        WHEN score >= 60 THEN RETURN 'good';
        WHEN score >= 40 THEN RETURN 'moderate';
        ELSE RETURN 'poor';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create view for call statistics
CREATE OR REPLACE VIEW call_statistics AS
SELECT
    h.name as hospital_name,
    DATE(c.scheduled_call_date) as call_date,
    COUNT(*) as total_calls,
    COUNT(CASE WHEN c.call_status = 'completed' THEN 1 END) as completed_calls,
    COUNT(CASE WHEN c.call_status = 'failed' THEN 1 END) as failed_calls,
    COUNT(CASE WHEN c.call_status = 'pending' THEN 1 END) as pending_calls,
    ROUND(AVG(c.medical_score), 2) as avg_medical_score,
    ROUND(AVG(c.call_duration), 2) as avg_call_duration
FROM calls c
JOIN hospitals h ON c.hospital_id = h.id
GROUP BY h.name, DATE(c.scheduled_call_date)
ORDER BY call_date DESC;

-- Create view for patient call history
CREATE OR REPLACE VIEW patient_call_history AS
SELECT
    p.patient_number,
    p.first_name,
    p.last_name,
    p.phone,
    h.name as hospital_name,
    s.name as service_name,
    d.first_name || ' ' || d.last_name as doctor_name,
    c.scheduled_call_date,
    c.actual_call_date,
    c.call_status,
    c.medical_score,
    c.call_duration,
    ms.score_category
FROM patients p
JOIN calls c ON p.id = c.patient_id
JOIN hospitals h ON p.hospital_id = h.id
LEFT JOIN services s ON p.service_id = s.id
LEFT JOIN doctors d ON p.doctor_id = d.id
LEFT JOIN medical_scores ms ON c.id = ms.call_id
ORDER BY c.scheduled_call_date DESC;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hellojade;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hellojade;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO hellojade;
