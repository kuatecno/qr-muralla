// Instagram Verification Integration
// API Documentation: https://flowkick.com/api/verification

const IG_VERIFICATION_CONFIG = {
  apiUrl: '/api', // Use our own proxy endpoints to avoid CORS
  webhookUrl: 'https://qr.murallacafe.cl/api/ig-webhook',
  expiresInMinutes: 10
};

class InstagramVerification {
  constructor(config) {
    this.config = config;
    this.sessionId = null;
    this.pollInterval = null;
  }

  // Generate verification code
  async generateCode(externalUserId) {
    const url = `${this.config.apiUrl}/ig-verify-generate`;
    console.log('[IG Verification] Requesting:', url);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          external_user_id: externalUserId,
          webhook_url: this.config.webhookUrl,
          expires_in_minutes: this.config.expiresInMinutes
        })
      });

      console.log('[IG Verification] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[IG Verification] Error response:', errorData);
        throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      this.sessionId = data.session_id;
      
      console.log('[IG Verification] Code generated:', data);
      
      // Normalize response format (API returns 'code' instead of 'verification_code')
      if (data.code && !data.verification_code) {
        data.verification_code = data.code;
      }
      
      return data;
    } catch (error) {
      console.error('[IG Verification] Generate failed:', error);
      console.error('[IG Verification] URL was:', url);
      throw error;
    }
  }

  // Check verification status
  async checkStatus() {
    if (!this.sessionId) {
      throw new Error('No active session. Generate a code first.');
    }

    try {
      const response = await fetch(
        `${this.config.apiUrl}/ig-verify-check?session=${this.sessionId}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log('[IG Verification] Status:', data);
      return data;
    } catch (error) {
      console.error('[IG Verification] Check failed:', error);
      throw error;
    }
  }

  // Start polling for verification
  startPolling(onVerified, onError, intervalMs = 3000) {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }

    console.log('[IG Verification] Starting polling...');
    
    this.pollInterval = setInterval(async () => {
      try {
        const status = await this.checkStatus();
        
        if (status.status === 'verified') {
          console.log('[IG Verification] Verified!', status);
          this.stopPolling();
          if (onVerified) onVerified(status);
        } else if (status.status === 'expired') {
          console.warn('[IG Verification] Code expired');
          this.stopPolling();
          if (onError) onError(new Error('Verification code expired'));
        }
      } catch (error) {
        console.error('[IG Verification] Poll error:', error);
        if (onError) onError(error);
      }
    }, intervalMs);
  }

  // Stop polling
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      console.log('[IG Verification] Polling stopped');
    }
  }

  // Reset session
  reset() {
    this.stopPolling();
    this.sessionId = null;
  }
}

// UI Helper Functions
function showVerificationModal(verificationCode, expiresAt) {
  const modal = document.createElement('div');
  modal.className = 'ig-verification-modal';
  modal.innerHTML = `
    <div class="ig-verification-overlay"></div>
    <div class="ig-verification-content">
      <button class="ig-verification-close" id="igVerifyClose">✕</button>
      
      <div class="ig-verification-header">
        <div class="ig-icon">📸</div>
        <h2>Verificación Instagram</h2>
        <p>Envía este código por DM a @murallacafe</p>
      </div>
      
      <div class="ig-verification-code">
        <div class="code-display">${verificationCode}</div>
        <button class="code-copy" id="igCopyCode">
          <span class="copy-icon">📋</span>
          Copiar código
        </button>
      </div>
      
      <div class="ig-verification-steps">
        <div class="step">
          <span class="step-number">1</span>
          <span class="step-text">Copia el código de arriba</span>
        </div>
        <div class="step">
          <span class="step-number">2</span>
          <span class="step-text">Abre Instagram y busca @murallacafe</span>
        </div>
        <div class="step">
          <span class="step-number">3</span>
          <span class="step-text">Envía el código por mensaje directo</span>
        </div>
      </div>
      
      <div class="ig-verification-status">
        <div class="status-spinner"></div>
        <p class="status-text">Esperando verificación...</p>
        <p class="status-expires">Expira en <span id="igTimeLeft">${expiresAt}</span></p>
      </div>
      
      <a href="https://instagram.com/murallacafe" target="_blank" class="ig-open-app">
        Abrir Instagram
      </a>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Copy code functionality
  document.getElementById('igCopyCode')?.addEventListener('click', () => {
    navigator.clipboard.writeText(verificationCode);
    const btn = document.getElementById('igCopyCode');
    btn.innerHTML = '<span class="copy-icon">✓</span> Copiado!';
    setTimeout(() => {
      btn.innerHTML = '<span class="copy-icon">📋</span> Copiar código';
    }, 2000);
  });
  
  // Close modal
  document.getElementById('igVerifyClose')?.addEventListener('click', () => {
    modal.remove();
  });
  
  return modal;
}

function updateVerificationStatus(modal, status) {
  const statusEl = modal.querySelector('.ig-verification-status');
  
  if (status === 'verified') {
    statusEl.innerHTML = `
      <div class="status-success">✓</div>
      <p class="status-text success">¡Verificado exitosamente!</p>
    `;
    setTimeout(() => modal.remove(), 2000);
  } else if (status === 'error') {
    statusEl.innerHTML = `
      <div class="status-error">✕</div>
      <p class="status-text error">Error en la verificación</p>
    `;
  } else if (status === 'expired') {
    statusEl.innerHTML = `
      <div class="status-error">⏱</div>
      <p class="status-text error">Código expirado</p>
    `;
  }
}

// Export for use in other scripts
export { InstagramVerification, IG_VERIFICATION_CONFIG, showVerificationModal, updateVerificationStatus };
