# Tax

## Parser con IA (Gemini)

La app ahora intenta parsear con IA primero, y si falla usa parser local.

### 1) Variables de entorno

En tu backend (`.env` en la raiz del proyecto):

```
GEMINI_API_KEY=tu_api_key
PARSE_API_PORT=8787
```

En tu app Expo (`.env` o `.env.local`):

```
EXPO_PUBLIC_PARSE_API_URL=http://TU_IP_LOCAL:8787
```

Nota: en Android emulador podés usar `http://10.0.2.2:8787`.

### 2) Levantar backend de parseo

```bash
npm run parse-api
```

### 3) Levantar app

```bash
npm start
```