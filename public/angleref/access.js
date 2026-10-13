/**
 * Sistema de Control de Acceso y Límites Diarios para Rooster AngleRef
 * - Administradores, Profesores y Alumnos de Rooster: Acceso ilimitado sin restricciones.
 * - Visitantes libres: 3 búsquedas gratuitas por día, reinicio a las 00:00 hs.
 */

export const AccessControl = {
  DAILY_LIMIT: 3,

  getUserRole() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const paramRole = urlParams.get('role') || urlParams.get('access');
      if (paramRole === 'admin' || paramRole === 'teacher' || paramRole === 'profesor' || paramRole === 'student') {
        const normalized = paramRole === 'profesor' ? 'teacher' : paramRole;
        localStorage.setItem('rooster_angleref_role', normalized);
        return normalized;
      }
      if (paramRole === 'visitor' || paramRole === 'free') {
        localStorage.removeItem('rooster_angleref_role');
      }

      const savedRole = localStorage.getItem('rooster_angleref_role');
      if (savedRole === 'visitor') {
        return null;
      }
      if (savedRole === 'admin' || savedRole === 'teacher' || savedRole === 'student') {
        return savedRole;
      }

      // Buscar en localStorage de la web de Rooster
      const rawUser = localStorage.getItem('rooster_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u) {
          if (u.role === 'admin') return 'admin';
          if (u.role === 'teacher' || u.role === 'profesor') return 'teacher';
          if (u.role === 'student') return 'student';
          if (u.pagos && u.pagos.length > 0) return 'student';
        }
      }

      // En entorno local (localhost:3005) dar acceso de Administrador por defecto al propietario
      if (this.isLocalhost()) {
        return 'admin';
      }

      return null;
    } catch (e) {
      return null;
    }
  },

  isLocalhost() {
    const h = window.location.hostname;
    return h === 'localhost' || h === '127.0.0.1';
  },

  isUnlimited() {
    return Boolean(this.getUserRole());
  },

  // Alias para compatibilidad
  isStudentOrAdmin() {
    return this.isUnlimited();
  },

  getTodayString() {
    return new Date().toISOString().slice(0, 10);
  },

  getUsage() {
    try {
      const raw = localStorage.getItem('rooster_angleref_usage');
      if (!raw) return { date: this.getTodayString(), count: 0 };
      const data = JSON.parse(raw);
      if (data.date !== this.getTodayString()) {
        return { date: this.getTodayString(), count: 0 };
      }
      return data;
    } catch (e) {
      return { date: this.getTodayString(), count: 0 };
    }
  },

  resetUsage() {
    localStorage.setItem('rooster_angleref_usage', JSON.stringify({ date: this.getTodayString(), count: 0 }));
    this.updateUI();
    this.closePaywall();
  },

  enableAdminLocal() {
    localStorage.setItem('rooster_angleref_role', 'admin');
    this.resetUsage();
  },

  getRemaining() {
    if (this.isUnlimited()) return Infinity;
    const usage = this.getUsage();
    return Math.max(0, this.DAILY_LIMIT - usage.count);
  },

  canPerformSearch() {
    if (this.isUnlimited()) return true;
    const usage = this.getUsage();
    return usage.count < this.DAILY_LIMIT;
  },

  recordSearch() {
    if (this.isUnlimited()) return true;
    const usage = this.getUsage();
    if (usage.count >= this.DAILY_LIMIT) {
      this.showPaywall();
      this.updateUI();
      return false;
    }
    usage.count += 1;
    usage.date = this.getTodayString();
    localStorage.setItem('rooster_angleref_usage', JSON.stringify(usage));
    this.updateUI();
    return true;
  },

  showPaywall() {
    const modal = document.getElementById('paywallModal');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('active');
    }
  },

  closePaywall() {
    const modal = document.getElementById('paywallModal');
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
    }
  },

  updateUI() {
    const badge = document.getElementById('userAccessBadge');
    if (!badge) return;

    const role = this.getUserRole();
    if (role === 'admin') {
      badge.className = 'user-access-badge student';
      badge.innerText = this.isLocalhost() ? 'Administrador · Acceso Ilimitado (clic para simular visitante)' : 'Administrador · Acceso Ilimitado';
    } else if (role === 'teacher') {
      badge.className = 'user-access-badge student';
      badge.innerText = 'Profesor Rooster · Acceso Ilimitado';
    } else if (role === 'student') {
      badge.className = 'user-access-badge student';
      badge.innerText = 'Alumno Rooster · Acceso Ilimitado';
    } else {
      const remaining = this.getRemaining();
      if (remaining > 0) {
        badge.className = 'user-access-badge free';
        badge.innerText = `Búsquedas gratis hoy: ${remaining} de ${this.DAILY_LIMIT}`;
      } else {
        badge.className = 'user-access-badge limit-reached';
        badge.innerText = this.isLocalhost() ? 'Límite diario alcanzado (3 de 3) · Clic para reiniciar' : 'Límite diario alcanzado (3 de 3)';
      }
    }
  },

  init() {
    this.updateUI();

    const badge = document.getElementById('userAccessBadge');
    if (badge && this.isLocalhost()) {
      badge.style.cursor = 'pointer';
      badge.title = 'Modo Local: Clic para alternar entre Visitante (3 búsquedas) y Administrador Ilimitado';
      badge.addEventListener('click', () => {
        if (this.getUserRole()) {
          localStorage.setItem('rooster_angleref_role', 'visitor');
          this.resetUsage();
        } else {
          this.enableAdminLocal();
        }
      });
    }

    const closeBtn = document.getElementById('btnPaywallClose');
    const backdrop = document.getElementById('paywallBackdrop');
    const resetLocalBtn = document.getElementById('btnPaywallResetLocal');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closePaywall());
    if (backdrop) backdrop.addEventListener('click', () => this.closePaywall());
    if (resetLocalBtn) {
      if (this.isLocalhost()) {
        resetLocalBtn.style.display = 'block';
        resetLocalBtn.addEventListener('click', () => this.enableAdminLocal());
      } else {
        resetLocalBtn.style.display = 'none';
      }
    }

    window.addEventListener('storage', () => {
      this.updateUI();
    });
  }
};
