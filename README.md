# Invitación de Boda (vídeo + web por bloques)

Este proyecto es una invitación digital para boda pensada en **mobile first**. Al cargar la página se muestra un vídeo a pantalla completa; al hacer clic se reproduce, y al terminar hace un **fade out en blanco** para revelar la web principal. La web está organizada en bloques con información distinta y un botón final que enlaza a un **Google Forms** para confirmar asistencia.

---

## Estructura del proyecto
```
/ (raíz del proyecto)
  ├── index.html            # Estructura principal (vídeo + bloques)
  ├── /css/envelope.css     # Estilos y layout (mobile first)
  ├── /js/guest.js          # Carga y normaliza datos del invitado
  ├── /js/envelope.js       # Lógica de vídeo, fade y bloques
  ├── /data/guests.json     # Datos de invitados
  ├── /media/               # Vídeo e imágenes
  ├── 404.html              # Mensaje en caso de enlace no encontrado
  └── README.md             # Documentación
```

---

## Cómo funciona (lógica actual)
1. **Pantalla de vídeo**: se muestra el vídeo a pantalla completa y la web queda oculta.
2. **Inicio**: al hacer clic (o con el botón “Abrir”), `envelope.js` carga el invitado y reproduce el vídeo.
3. **Transición**: al finalizar, se hace un flash blanco y aparece la web. Si el usuario tiene reducción de movimiento, se salta el vídeo y se muestra la web al instante.
4. **Relleno de bloques**:
   - `guest.js` lee el slug desde `?g=...` o `?guest=...` (si no existe usa `default`).
   - Carga `data/guests.json` con `cache: no-store` y busca el invitado (case-insensitive).
   - Se pintan los bloques: carta, cuenta atrás, mapa, información útil y botón RSVP.

---

## URLs recomendadas
- **GitHub Pages**: `https://tusitio.github.io/?g=slug` o `?guest=slug`
- **Sin parámetro**: se utiliza el invitado `default`.

---

## Página 404
Si alguien llega a `404.html`, verá un mensaje indicando que se ponga en contacto con nosotros por WhatsApp.

---

## Modelo de datos (`data/guests.json`)
El archivo es un objeto con una clave `guests` que contiene un array de invitados:

```json
{
  "guests": [
    {
      "slug": "default",
      "displayName": "Familia y amigos",
      "message": "Nos hará muchísima ilusión contar contigo en este día tan especial.",
      "when": "Sábado, 20 de junio de 2026 · 17:30",
      "eventDateISO": "2026-06-20T17:30:00+01:00",
      "venueName": "Parque Vacacional Eden",
      "venueCity": "",
      "venueMap": "https://maps.app.goo.gl/xn9VsiUX7QV5tfTeA",
      "venueMapEmbed": "https://www.google.com/maps?output=embed&q=28.4090376,-16.5433955",
      "plus": 0,
      "dressCode": "Elegante cómodo",
      "notes": [
        "Aparcamiento disponible en el recinto.",
        "Si tienes alergias alimentarias, avísanos con tiempo."
      ],
      "rsvpUrl": "https://forms.gle/XXXXXXXXXXXXXXX"
    }
  ]
}
```

### Campos
- `slug`: identificador único en la URL.
- `displayName`: nombre visible del invitado.
- `message`: mensaje personalizado.
- `when`: texto libre mostrado en la invitación.
- `eventDateISO`: fecha ISO para la cuenta atrás (opcional).
- `venueName` / `venueCity`: nombre y ciudad del lugar.
- `venueMap`: enlace a Google Maps para abrir en pestaña nueva.
- `venueMapEmbed`: enlace de mapa embebido (si está vacío se usa `venueMap`).
- `plus`: número de acompañantes permitidos.
- `dressCode`: texto de dress code (se muestra tal cual).
- `notes`: lista de notas adicionales.
- `rsvpUrl`: URL del formulario de Google Forms.

---

## Notas
- El diseño está pensado en **mobile first**, con bloques a 100% de ancho y lectura clara en móvil.
- Mantén las URLs relativas (`./css`, `./js`, `./media`) para que funcione en GitHub Pages.
