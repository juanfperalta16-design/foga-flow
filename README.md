# FOGA Flow

Sistema interno de gestión de proyectos para FOGA — cocinas y muebles en acero inoxidable.

## Stack
- React 18 + Vite
- Tailwind CSS
- Firebase (Firestore + Hosting)

---

## 1. Clonar y configurar localmente

```bash
git clone https://github.com/TU_USUARIO/foga-flow.git
cd foga-flow
npm install
```

Copia el archivo de variables de entorno:
```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales de Firebase (ver sección de Firebase).

```bash
npm run dev
```

---

## 2. Configurar Firebase

### Crear proyecto
1. Ve a [https://console.firebase.google.com](https://console.firebase.google.com)
2. Crea un nuevo proyecto → nombre: `foga-flow`
3. Activa **Firestore Database** (modo producción)
4. Activa **Hosting**
5. Ve a **Configuración del proyecto → General → Tus apps → Web**
6. Copia el objeto `firebaseConfig` y pega los valores en `.env.local`

### Instalar Firebase CLI
```bash
npm install -g firebase-tools
firebase login
firebase init
```
Selecciona: **Firestore** y **Hosting** → usa el proyecto `foga-flow`

### Deploy manual
```bash
npm run build
firebase deploy
```

---

## 3. Configurar GitHub

### Subir el proyecto
```bash
git init
git add .
git commit -m "feat: initial commit FOGA Flow"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/foga-flow.git
git push -u origin main
```

### Agregar Secrets en GitHub (para deploy automático)
En GitHub → tu repo → **Settings → Secrets and variables → Actions → New repository secret**

Agrega estos secrets con los valores de tu `.env.local`:
| Secret | Valor |
|--------|-------|
| `VITE_FIREBASE_API_KEY` | Tu API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Tu auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Tu project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Tu storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Tu sender ID |
| `VITE_FIREBASE_APP_ID` | Tu app ID |
| `FIREBASE_SERVICE_ACCOUNT` | JSON de cuenta de servicio (ver abajo) |

### Obtener FIREBASE_SERVICE_ACCOUNT
1. Firebase Console → Configuración del proyecto → **Cuentas de servicio**
2. Clic en **Generar nueva clave privada**
3. Copia todo el contenido del JSON descargado
4. Pégalo como valor del secret `FIREBASE_SERVICE_ACCOUNT`

---

## 4. Flujo de trabajo diario

```bash
# Trabajar en una rama nueva
git checkout -b feature/nombre-cambio

# Hacer cambios, luego:
git add .
git commit -m "feat: descripción del cambio"
git push origin feature/nombre-cambio

# Abrir Pull Request en GitHub → merge a main → deploy automático
```

---

## Estructura del proyecto

```
foga-flow/
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── pages/          # Vistas principales
│   ├── firebase/       # config.js + firestoreService.js
│   ├── data/           # mockData.js (datos de prueba)
│   ├── utils/          # Helpers (fechas, estados, reglas)
│   └── App.jsx
├── .env.local          # 🔒 Credenciales — NO subir a GitHub
├── .env.example        # Plantilla segura para compartir
├── firebase.json       # Configuración Firebase Hosting
├── firestore.rules     # Reglas de seguridad Firestore
└── .github/workflows/  # Deploy automático con GitHub Actions
```
