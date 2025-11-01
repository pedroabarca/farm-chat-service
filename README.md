# farm-chat-service

WhatsApp AI Bot Service que procesa mensajes de WhatsApp y se comunica con el backend de FarmManagement.

## 🚀 Estado: PRODUCCIÓN

**URL Producción**: https://farm-chat-service-production.up.railway.app
**WhatsApp Webhook**: Configurado y operacional
**AI Provider**: Groq (Llama 3.3 70B)
**Plataforma**: Railway
**Estado**: ✅ Operacional

📖 **[Ver Guía de Mantenimiento →](../CLAUDE.md#maintenance-guide)**

---

## Descripción

Este servicio actúa como intermediario entre WhatsApp y el API de gestión de granja. Utiliza IA (Groq con modelo Llama 3.3 70B) para:
- Analizar mensajes de usuarios
- Determinar si necesita consultar el API
- Formatear respuestas en lenguaje natural

## Tech Stack

- **Runtime**: Bun v1.3.1 / Node.js v22+
- **Language**: TypeScript
- **Framework**: Express.js
- **AI/ML**: Groq SDK (Llama 3.3 70B Versatile)
- **HTTP Client**: Axios
- **Deployment**: Docker + Railway

## Instalación

```bash
bun install
# o si usas npm:
npm install
```

## Configuración

### Producción (Railway)

Variables de entorno configuradas en Railway:

```env
PORT=3000
NODE_ENV=production
GROQ_API_KEY=gsk_***
WHATSAPP_VERIFY_TOKEN=farm_webhook_verify_2024
WHATSAPP_ACCESS_TOKEN=EAAN5AFr***
WHATSAPP_PHONE_NUMBER_ID=844541108749170
WHATSAPP_API_URL=https://graph.facebook.com/v17.0
FARM_API_URL=https://farm-management-api-production.up.railway.app
```

**Nota**: El `WHATSAPP_ACCESS_TOKEN` debe renovarse periódicamente (cada 60 días). Ver [Guía de Mantenimiento](../CLAUDE.md#maintenance-guide).

### Desarrollo Local

Crea un archivo `.env` en la raíz del proyecto:

```env
PORT=3000
GROQ_API_KEY=tu_groq_api_key
WHATSAPP_VERIFY_TOKEN=tu_token_verificacion
WHATSAPP_ACCESS_TOKEN=tu_access_token
WHATSAPP_PHONE_NUMBER_ID=tu_phone_id
WHATSAPP_API_URL=https://graph.facebook.com/v17.0
FARM_API_URL=http://localhost:5205
```

**Obtener Groq API Key**: Gratis en https://console.groq.com

## Ejecutar

### Desarrollo Local
```bash
bun run dev
# o si usas npm:
npm run dev
```

El servicio estará disponible en: `http://localhost:3000`

### Producción (Railway)
Ver sección de [Deployment](#deployment) más abajo.

## Arquitectura y Comunicación

Este servicio se comunica con **FarmManagement API** para obtener/actualizar datos de la granja:

```
Usuario WhatsApp (+506 8376 1070)
      │
      │ "¿Cuántos animales tengo?"
      ↓
┌──────────────────────────────────────────────────────┐
│  Meta WhatsApp Business API                          │
│  Webhook: farm-chat-service-production.up.railway.app│
└────────────┬─────────────────────────────────────────┘
             │
             │ POST /webhook
             ↓
┌──────────────────────────────────────────────────────┐
│  farm-chat-service (Railway)                         │
│  ---------------------------------------------------│
│  1. Recibe mensaje (webhook.ts)                     │
│  2. Groq AI analiza: "necesito datos"               │
│     (Llama 3.3 70B)                                 │
│  3. Genera JSON:                                    │
│     {                                               │
│       "endpoint": "/api/animals",                   │
│       "method": "GET"                               │
│     }                                               │
│  (ChatService.ts:13-41)                             │
└────────────┬────────────────────────────────────────┘
             │
             │ HTTP GET
             │ farm-management-api-production.up.railway.app/api/animals
             │ (axios call)
             ↓
┌──────────────────────────────────────────────────────┐
│  FarmManagement API (Railway)                        │
│  ---------------------------------------------------│
│  1. AnimalsController.cs:19                         │
│  2. GetAllAnimalsQuery (MediatR)                    │
│  3. Query AWS RDS PostgreSQL (farmdb)               │
└────────────┬────────────────────────────────────────┘
             │
             │ Responde JSON:
             │ [
             │   {"id":1,"name":"Bessie","species":"Cow"},
             │   {"id":2,"name":"Luna","species":"Horse"}
             │ ]
             ↓
┌──────────────────────────────────────────────────────┐
│  farm-chat-service                                   │
│  ---------------------------------------------------│
│  4. Groq AI formatea respuesta                      │
│     (ChatService.ts:76-89)                          │
│  5. "Tienes 2 animales:                             │
│     Bessie la vaca y                                │
│     Luna la yegua"                                  │
└────────────┬────────────────────────────────────────┘
             │
             │ POST whatsapp message
             ↓
┌──────────────────────────────────────────────────────┐
│  Meta WhatsApp API                                   │
└────────────┬────────────────────────────────────────┘
             │
             ↓
      Usuario WhatsApp (+506 8376 1070)
```

## Endpoints

### Producción
- **GET** `https://farm-chat-service-production.up.railway.app/webhook` - Verificación de webhook de WhatsApp
- **POST** `https://farm-chat-service-production.up.railway.app/webhook` - Recibe mensajes de WhatsApp
- **POST** `https://farm-chat-service-production.up.railway.app/api/chat` - Endpoint directo para chat
- `/api-docs` - Documentación Swagger

### Desarrollo Local
- `GET /webhook` - Verificación de webhook
- `POST /webhook` - Recibe mensajes
- `POST /api/chat` - Chat directo
- `/api-docs` - Documentación Swagger

## Requisitos

### Producción
- ✅ Groq API Key (gratis en https://console.groq.com)
- ✅ WhatsApp Business API configurado
- ✅ FarmManagement API desplegado en Railway

### Desarrollo Local
- Groq API Key (gratis)
- FarmManagement API corriendo en `http://localhost:5205`
- (Opcional) ngrok para testing de webhook local

## Estructura del Proyecto

```
src/
├── application/
│   └── services/
│       └── ChatService.ts      # Lógica principal de procesamiento
├── domain/
│   └── Models/
│       └── ChatModel.ts        # Wrapper de Ollama
├── presentation/
│   └── routes/
│       ├── webhook.ts          # Webhook de WhatsApp
│       └── chatRoutes.ts       # Rutas de chat
└── server.ts                   # Punto de entrada
```

## Deployment

### Desplegar a Railway

1. **Instalar Railway CLI**:
   ```bash
   brew install railway
   railway login
   ```

2. **Configurar Proyecto**:
   ```bash
   cd farm-chat-service
   railway init  # Si es la primera vez
   railway link  # Para linkear a proyecto existente
   ```

3. **Configurar Variables de Entorno**:
   ```bash
   railway variables --set "PORT=3000"
   railway variables --set "NODE_ENV=production"
   railway variables --set "GROQ_API_KEY=tu_groq_api_key"
   railway variables --set "WHATSAPP_VERIFY_TOKEN=farm_webhook_verify_2024"
   railway variables --set "WHATSAPP_ACCESS_TOKEN=tu_whatsapp_token"
   railway variables --set "WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id"
   railway variables --set "WHATSAPP_API_URL=https://graph.facebook.com/v17.0"
   railway variables --set "FARM_API_URL=https://farm-management-api-production.up.railway.app"
   ```

4. **Deploy**:
   ```bash
   railway up
   ```

5. **Configurar WhatsApp Webhook**:
   - Ir a Meta Developer Console
   - Configurar webhook URL: `https://tu-servicio.up.railway.app/webhook`
   - Usar el mismo `WHATSAPP_VERIFY_TOKEN` que configuraste

6. **Ver Logs**:
   ```bash
   railway logs
   ```

**Nota**: El proyecto incluye un `Dockerfile` que Railway usa automáticamente para el deployment.

📖 **Ver guía completa de deployment**: [CLAUDE.md - Deployment Process](../CLAUDE.md#deployment-process)

## Mantenimiento

### Tareas Semanales
- ✅ Verificar logs en Railway Dashboard
- ✅ Renovar WhatsApp Access Token (cada 60 días)
- ✅ Revisar Railway credits ($5/mes free tier)

### Tareas Mensuales
- ✅ Actualizar dependencias Bun/npm
- ✅ Revisar uso de Groq API (aunque es ilimitado gratis)
- ✅ Testing de flujo completo WhatsApp → API

### Renovar WhatsApp Token

El WhatsApp Access Token expira cada 60 días. Para renovarlo:

1. Ir a Meta Developer Console
2. Obtener nuevo token
3. Actualizar en Railway:
   ```bash
   railway variables --set "WHATSAPP_ACCESS_TOKEN=nuevo_token"
   ```
4. Redeploy automático se ejecutará

📖 **Ver guía completa de mantenimiento**: [CLAUDE.md - Maintenance Guide](../CLAUDE.md#maintenance-guide)

## Seguridad

⚠️ **IMPORTANTE**:
- Los archivos `.env` y `deploy.sh` contienen credenciales sensibles y están en `.gitignore`
- NUNCA commitear archivos con API keys o tokens al repositorio
- El `WHATSAPP_ACCESS_TOKEN` expira cada 60 días y debe renovarse
- El `GROQ_API_KEY` es gratuito pero personal - no compartir públicamente
- Las variables de entorno en Railway contienen la configuración de producción

## Referencias

- Documentación completa: [CLAUDE.md](../CLAUDE.md) en la raíz del proyecto FARM
- [Bun Documentation](https://bun.sh)
- [Groq Documentation](https://console.groq.com/docs)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
