# Interactive Envelope Invite — README

Este proyecto es una invitación digital interactiva para bodas, desplegable en GitHub Pages, que muestra un sobre animado con una carta personalizada para cada invitado. Se basa en HTML, CSS y JavaScript puros, y carga los datos de invitados desde un archivo JSON.

---

## 📂 Estructura del proyecto
```
/ (raíz del proyecto)
  ├── index.html            # Página principal con la estructura del sobre y la carta
  ├── /css/envelope.css     # Estilos del sobre, animaciones y layout
  ├── /js/envelope.js       # Lógica de animación del sobre y carta
  ├── /js/guest.js          # Carga de datos del invitado según la URL
  ├── /data/guests.json     # Lista de invitados con sus datos personalizados
  ├── 404.html              # Redirección para manejar rutas personalizadas en GitHub Pages
  └── README.md             # Documentación del proyecto
```

---

## 🚀 Funcionamiento
1. **URL personalizada**: cada invitado recibe una URL única, por ejemplo:
    - En GitHub Pages: `https://tusitio.github.io/l9aQ7k`
    - En local: `http://127.0.0.1:5500/#!/l9aQ7k` o `?code=l9aQ7k`

2. **Carga de datos**:
    - `guest.js` extrae el `slug` de la URL (ya sea de la ruta, del hash o del parámetro `code`).
    - Se hace un `fetch` a `/data/guests.json` y se busca el invitado con ese `slug`.

3. **Animación**:
    - Al hacer clic, el sello se desvanece, el sobre se abre y la carta emerge con el contenido personalizado.

---

## 🔗 Rutas y compatibilidad
- **GitHub Pages**: el archivo `404.html` redirige cualquier URL no encontrada a la raíz con un hash (`#!/slug`), para que el JS pueda interpretar el slug.
- **Local (Live Server)**: no soporta rutas personalizadas sin archivo físico. Usa `#!/slug` o `?code=slug` para pruebas.

---

## 🛠 Cómo desplegar
1. Sube todos los archivos a un repositorio en GitHub.
2. Activa GitHub Pages desde la rama `main` o `gh-pages`, carpeta `/` (root).
3. Asegúrate de que `guests.json` esté en `/data/` y las rutas en el HTML apunten a `./css/` y `./js/`.

---

## 📌 Notas importantes
- **Case-sensitive**: en GitHub Pages, `Guests.json` ≠ `guests.json`.
- **Pruebas locales**: siempre usa hash o query param para evitar errores 404.
- **Privacidad**: si la invitación contiene datos sensibles, evita hacer público el repo o cifra los datos.

---

## 📄 Ejemplo de guests.json
```json
[
  {
    "slug": "l9aQ7k",
    "nombre": "Lidia",
    "mensaje": "¡Te invitamos a nuestra boda el 12 de junio de 2026!"
  },
  {
    "slug": "x8Bv3f",
    "nombre": "Juan",
    "mensaje": "¡Nos encantaría que nos acompañes en este día especial!"
  }
]
```

---

Con esto tendrás un sistema de invitaciones digitales interactivo, ligero y gratuito usando GitHub Pages.
