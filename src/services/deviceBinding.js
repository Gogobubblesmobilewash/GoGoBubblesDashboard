import { supabase } from './api';
import { sha256 } from 'js-sha256';

class DeviceBindingService {
  // Generate a comprehensive device fingerprint
  static generateDeviceFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvasFingerprint: canvas.toDataURL(),
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth,
      availableWidth: screen.availWidth,
      availableHeight: screen.availHeight,
      timestamp: new Date().toISOString()
    };

    return fingerprint;
  }

  // Hash the device fingerprint for security
  static hashFingerprint(fingerprint) {
    return sha256(JSON.stringify(fingerprint));
  }

  // Get device metadata for display
  static getDeviceMetadata(fingerprint) {
    return {
      browser: this.getBrowserInfo(fingerprint.userAgent),
      os: this.getOSInfo(fingerprint.userAgent),
      screen: `${fingerprint.screenResolution}`,
      timezone: fingerprint.timezone,
      language: fingerprint.language
    };
  }

  // Extract browser information from user agent
  static getBrowserInfo(userAgent) {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  // Extract OS information from user agent
  static getOSInfo(userAgent) {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  // Validate device binding for a user
  static async validateDeviceBinding(bubblerId, fingerprint) {
    try {
      const fingerprintHash = this.hashFingerprint(fingerprint);
      
      // Call the database function to validate
      const { data, error } = await supabase.rpc('validate_device_binding', {
        p_bubbler_id: bubblerId,
        p_device_fingerprint_hash: fingerprintHash
      });

      if (error) throw error;

      // Log the login attempt
      await this.logLoginAttempt(bubblerId, fingerprint, data);

      return {
        isValid: data,
        fingerprintHash,
        requiresBinding: !data && !(await this.hasActiveBinding(bubblerId))
      };
    } catch (error) {
      console.error('Error validating device binding:', error);
      return { isValid: false, error: error.message };
    }
  }

  // Check if user has any active device binding
  static async hasActiveBinding(bubblerId) {
    try {
      const { data, error } = await supabase
        .from('device_fingerprints')
        .select('id')
        .eq('bubbler_id', bubblerId)
        .eq('is_active', true)
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking active binding:', error);
      return false;
    }
  }

  // Bind device to user account
  static async bindDevice(bubblerId, fingerprint, createdByAdmin = false) {
    try {
      const fingerprintHash = this.hashFingerprint(fingerprint);
      const deviceMetadata = this.getDeviceMetadata(fingerprint);

      // Deactivate any existing bindings
      await supabase
        .from('device_fingerprints')
        .update({ is_active: false })
        .eq('bubbler_id', bubblerId);

      // Create new binding
      const { data, error } = await supabase
        .from('device_fingerprints')
        .insert([{
          bubbler_id: bubblerId,
          fingerprint_hash: fingerprintHash,
          device_metadata: deviceMetadata,
          is_active: true,
          created_by_admin: createdByAdmin
        }])
        .select()
        .single();

      if (error) throw error;

      // Update legacy field for backward compatibility
      await supabase
        .from('bubblers')
        .update({
          device_binding: fingerprintHash,
          device_binding_date: new Date().toISOString()
        })
        .eq('id', bubblerId);

      return data;
    } catch (error) {
      console.error('Error binding device:', error);
      throw error;
    }
  }

  // Clear device binding (admin function)
  static async clearDeviceBinding(bubblerId) {
    try {
      // Deactivate all bindings for this user
      const { error } = await supabase
        .from('device_fingerprints')
        .update({ 
          is_active: false,
          reset_count: supabase.raw('reset_count + 1')
        })
        .eq('bubbler_id', bubblerId);

      if (error) throw error;

      // Clear legacy field
      await supabase
        .from('bubblers')
        .update({
          device_binding: null,
          device_binding_date: null
        })
        .eq('id', bubblerId);

      return true;
    } catch (error) {
      console.error('Error clearing device binding:', error);
      throw error;
    }
  }

  // Log login attempt for audit trail
  static async logLoginAttempt(bubblerId, fingerprint, success, failureReason = null) {
    try {
      const fingerprintHash = this.hashFingerprint(fingerprint);
      
      // Get IP address (this would need to be passed from the server in production)
      const ipAddress = await this.getClientIP();
      
      await supabase.rpc('log_login_attempt', {
        p_bubbler_id: bubblerId,
        p_ip_address: ipAddress,
        p_device_fingerprint_hash: fingerprintHash,
        p_user_agent: fingerprint.userAgent,
        p_login_success: success,
        p_failure_reason: failureReason,
        p_session_id: this.generateSessionId()
      });
    } catch (error) {
      console.error('Error logging login attempt:', error);
    }
  }

  // Get client IP address (simplified - in production this would come from server)
  static async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Error getting IP address:', error);
      return 'unknown';
    }
  }

  // Generate session ID
  static generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Get device binding information for admin display
  static async getDeviceBindingInfo(bubblerId) {
    try {
      const { data, error } = await supabase
        .from('device_fingerprints')
        .select('*')
        .eq('bubbler_id', bubblerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error getting device binding info:', error);
      return [];
    }
  }

  // Get login history for admin display
  static async getLoginHistory(bubblerId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('login_history')
        .select('*')
        .eq('bubbler_id', bubblerId)
        .order('login_time', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error getting login history:', error);
      return [];
    }
  }
}

export default DeviceBindingService; 