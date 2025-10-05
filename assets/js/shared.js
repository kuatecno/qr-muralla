// Shared functionality across all pages
class MurallaShared {
  constructor() {
    this.config = null;
    this.today = null;
  }

  async loadConfig() {
    try {
      const response = await fetch('/assets/data/config.json');
      this.config = await response.json();
      this.setupLogo();
    } catch (error) {
      console.log('Could not load config');
    }
  }

  async loadToday() {
    try {
      const response = await fetch('/assets/data/today.json');
      this.today = await response.json();
      this.setupTicker();
    } catch (error) {
      console.log('Could not load today data');
    }
  }

  setupLogo() {
    const brandLogo = document.getElementById('brandLogo');
    const brandText = document.getElementById('brandText');

    if (this.config?.brand?.logo && brandLogo && brandText) {
      brandLogo.src = this.config.brand.logo;
      brandLogo.alt = this.config.brand.alt || 'Muralla logo';
      brandLogo.hidden = false;
      brandText.style.display = 'none';
    }
  }

  setupTicker() {
    const tickerTrack = document.getElementById('tickerTrack');
    if (!tickerTrack || !this.today?.items?.length) return;

    const items = this.today.items;
    const dup = items.concat(items).concat(items);

    tickerTrack.innerHTML = dup.map(item => {
      const price = item.price ? `<span class="price">$${Number(item.price).toLocaleString("es-CL")}</span>` : "";
      return `<a class="tick" href="#" title="Reservar ${item.name}">
        <strong>${item.name}</strong> ${price}
      </a>`;
    }).join('');
  }

  async init() {
    await Promise.all([
      this.loadConfig(),
      this.loadToday()
    ]);
  }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.muralla = new MurallaShared();
  window.muralla.init();
});