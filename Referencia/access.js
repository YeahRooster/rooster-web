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
      if (paramRole === 'admin') return 'admin';
      if (paramRole === 'teacher' || paramRole === 'profesor') return 'teacher';
      if (paramRole === 'student') return 'student';

      // Buscar en localStorage de la web de Rooster
      const rawUser = localStorage.getItem('rooster_user');
      if (!rawUser) return null;
      const u = JSON.parse(rawUser);
      if (!u) return null;

      if (u.role === 'admin') return 'admin';
      if (u.role === 'teacher' || u.role === 'profesor') return 'teacher';
      if (u.role === 'student') return 'student';
      if (u.pagos && u.pagos.length > 0) return 'student';

      return null;
    } catch (e) {
      return null;
    }
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
    }
  },

  closePaywall() {
    const modal = document.getElementById('paywallModal');
    if (modal) {
      modal.style.display = 'none';
    }
  },

  updateUI() {
    const badge = document.getElementById('userAccessBadge');
    if (!badge) return;

    const role = this.getUserRole();
    if (role === 'admin') {
      badge.className = 'user-access-badge student';
      badge.innerText = 'Administrador · Acceso Ilimitado';
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
        badge.innerText = `Límite diario alcanzado (3 de 3)`;
      }
    }
  },

  init() {
    this.updateUI();

    const closeBtn = document.getElementById('btnPaywallClose');
    const backdrop = document.getElementById('paywallBackdrop');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closePaywall());
    if (backdrop) backdrop.addEventListener('click', () => this.closePaywall());

    window.addEventListener('storage', () => {
      this.updateUI();
    });
  }
};
