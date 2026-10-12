import config from '../config.js';
import { escapeHtml } from '../utils.js';

export function renderContacto() {
  const { whatsapp, email, direccion, horario } = config.contacto;

  const items = [
    {
      icon: '📱',
      label: 'WhatsApp',
      value: `+${whatsapp}`,
      href: `https://wa.me/${whatsapp}`,
      linkText: 'Escribinos ahora',
    },
    {
      icon: '✉️',
      label: 'Email',
      value: email,
      href: `mailto:${email}`,
      linkText: 'Mandar email',
    },
    {
      icon: '📍',
      label: 'Dirección',
      value: direccion,
    },
    {
      icon: '🕐',
      label: 'Horario de atención',
      value: horario,
    },
  ];

  return `
    <section class="section contacto" aria-labelledby="contact-title">
      <div class="container">
        <header class="section__header">
          <p class="section__label">Comunicate</p>
          <h2 class="section__title" id="contact-title">Contacto</h2>
          <p class="section__sub">Estamos para escucharte. Escribinos por cualquiera de estos medios.</p>
        </header>

        <div class="contact-grid">
          ${items.map(item => `
            <div class="contact-item">
              <div class="contact-item__icon" aria-hidden="true">${item.icon}</div>
              <div>
                <p class="contact-item__label">${escapeHtml(item.label)}</p>
                <p class="contact-item__value">${escapeHtml(item.value)}</p>
                ${item.href ? `
                  <a
                    href="${escapeHtml(item.href)}"
                    class="contact-item__link"
                    target="${item.href.startsWith('http') ? '_blank' : '_self'}"
                    rel="${item.href.startsWith('http') ? 'noopener noreferrer' : ''}"
                  >${escapeHtml(item.linkText)}</a>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}
