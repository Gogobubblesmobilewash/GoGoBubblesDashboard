-- Migration: Enhanced device binding and security tracking
-- This prevents account sharing by binding accounts to specific devices

-- Add device binding columns to bubblers table (simplified version)
ALTER TABLE bubblers 
ADD COLUMN IF NOT EXISTS device_binding TEXT,
ADD COLUMN IF NOT EXISTS device_binding_date TIMESTAMP WITH TIME ZONE;

-- Create dedicated device fingerprints table for better tracking
CREATE TABLE IF NOT EXISTS device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bubbler_id UUID REFERENCES bubblers(id) ON DELETE CASCADE,
  fingerprint_hash TEXT NOT NULL,
  device_metadata JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by_admin BOOLEAN DEFAULT false,
  reset_count INTEGER DEFAULT 0
);

-- Create login history table for audit trail
CREATE TABLE IF NOT EXISTS login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bubbler_id UUID REFERENCES bubblers(id) ON DELETE CASCADE,
  ip_address TEXT,
  device_fingerprint_hash TEXT,
  user_agent TEXT,
  login_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  login_success BOOLEAN DEFAULT true,
  failure_reason TEXT,
  session_id TEXT
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_bubbler_id ON device_fingerprints(bubbler_id);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_active ON device_fingerprints(is_active);
CREATE INDEX IF NOT EXISTS idx_login_history_bubbler_id ON login_history(bubbler_id);
CREATE INDEX IF NOT EXISTS idx_login_history_time ON login_history(login_time);

-- Add comments explaining the security system
COMMENT ON TABLE device_fingerprints IS 'Stores device fingerprints to prevent account sharing';
COMMENT ON TABLE login_history IS 'Audit trail of login attempts for security monitoring';
COMMENT ON COLUMN bubblers.device_binding IS 'Legacy field - use device_fingerprints table instead';
COMMENT ON COLUMN device_fingerprints.fingerprint_hash IS 'Hashed device fingerprint for security';
COMMENT ON COLUMN device_fingerprints.device_metadata IS 'JSON object containing device information';
COMMENT ON COLUMN device_fingerprints.reset_count IS 'Number of times device binding has been reset';

-- Create function to log login attempts
CREATE OR REPLACE FUNCTION log_login_attempt(
  p_bubbler_id UUID,
  p_ip_address TEXT,
  p_device_fingerprint_hash TEXT,
  p_user_agent TEXT,
  p_login_success BOOLEAN,
  p_failure_reason TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO login_history (
    bubbler_id, 
    ip_address, 
    device_fingerprint_hash, 
    user_agent, 
    login_success, 
    failure_reason, 
    session_id
  ) VALUES (
    p_bubbler_id, 
    p_ip_address, 
    p_device_fingerprint_hash, 
    p_user_agent, 
    p_login_success, 
    p_failure_reason, 
    p_session_id
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to validate device binding
CREATE OR REPLACE FUNCTION validate_device_binding(
  p_bubbler_id UUID,
  p_device_fingerprint_hash TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_has_active_binding BOOLEAN;
  v_matching_fingerprint BOOLEAN;
BEGIN
  -- Check if user has any active device binding
  SELECT EXISTS(
    SELECT 1 FROM device_fingerprints 
    WHERE bubbler_id = p_bubbler_id AND is_active = true
  ) INTO v_has_active_binding;
  
  -- If no active binding, allow login (first time setup)
  IF NOT v_has_active_binding THEN
    RETURN true;
  END IF;
  
  -- Check if current fingerprint matches any active binding
  SELECT EXISTS(
    SELECT 1 FROM device_fingerprints 
    WHERE bubbler_id = p_bubbler_id 
    AND fingerprint_hash = p_device_fingerprint_hash 
    AND is_active = true
  ) INTO v_matching_fingerprint;
  
  RETURN v_matching_fingerprint;
END;
$$ LANGUAGE plpgsql; 