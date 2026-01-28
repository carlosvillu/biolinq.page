# FEATURE_11.1_MARKDOWN_INFRASTRUCTURE

## 1. Natural Language Description

### Current State
- El footer de BioLinq tiene links a `/terms` y `/privacy` que devuelven 404 (las rutas no existen)
- No existe página de cookies ni link en el footer
- El proyecto no tiene infraestructura para parsear Markdown
- No existe directorio `content/` para almacenar contenido estático
- Todo el contenido textual está en archivos JSON de i18n (`app/locales/*.json`)

### Expected End State
- Paquete `marked` instalado para parsing de Markdown a HTML
- Estructura de directorios `content/legal/en/` y `content/legal/es/` creada
- Archivos Markdown para Terms, Privacy y Cookies en ambos idiomas con contenido template genérico
- Contenido legal listo para ser consumido por un servicio en tareas posteriores

**Nota:** Esta tarea solo establece la infraestructura (paquete + archivos). Las rutas, servicio y componentes se crean en tareas 11.2-11.6.

---

## 2. Technical Description

### Approach
1. Instalar el paquete `marked` como dependencia de producción
2. Crear estructura de directorios para contenido legal por idioma
3. Crear archivos Markdown con plantillas genéricas para cada página legal
4. Los archivos Markdown usarán formato estándar con H1 para título, H2 para secciones

### Architecture Decisions
- **Markdown sobre JSON:** El contenido legal es largo y con formato rico. Markdown es más fácil de editar y mantener que strings JSON largos
- **Archivos por idioma:** Separar `content/legal/en/` y `content/legal/es/` permite traducciones completas sin mezclar idiomas
- **`marked` sobre alternativas:** Es ligero, rápido, sin dependencias, y bien mantenido. Suficiente para HTML estático

### File Structure
```
content/
└── legal/
    ├── en/
    │   ├── terms.md
    │   ├── privacy.md
    │   └── cookies.md
    └── es/
        ├── terms.md
        ├── privacy.md
        └── cookies.md
```

---

## 2.1. Architecture Gate

- **Pages are puzzles:** N/A - Esta tarea no crea rutas ni componentes
- **Loaders/actions are thin:** N/A - Esta tarea no crea loaders ni actions
- **Business logic is not in components:** N/A - Esta tarea solo crea archivos estáticos y añade una dependencia

Esta tarea es **preparatoria** - establece la infraestructura que las tareas 11.2-11.6 consumirán.

---

## 3. Files to Change/Create

### `package.json`
**Objective:** Añadir `marked` como dependencia de producción

**Pseudocode:**
```pseudocode
// Ejecutar comando npm
RUN: npm install marked
// Esto añadirá "marked": "^X.X.X" a dependencies en package.json
// y actualizará package-lock.json
```

---

### `content/legal/en/terms.md`
**Objective:** Template de Terms of Service en inglés para BioLinq

**Pseudocode:**
```pseudocode
MARKDOWN CONTENT:
  H1: Terms of Service

  H2: 1. Acceptance of Terms
  PARAGRAPH: By accessing BioLinq, you agree to these terms...

  H2: 2. Description of Service
  PARAGRAPH: BioLinq provides a link-in-bio service...

  H2: 3. User Accounts
  PARAGRAPH: You must create an account via Google OAuth...
  PARAGRAPH: You are responsible for your account...

  H2: 4. User Content
  PARAGRAPH: You retain ownership of links you create...
  PARAGRAPH: You must not post illegal or harmful content...

  H2: 5. Premium Features
  PARAGRAPH: Premium features are available for one-time payment...
  PARAGRAPH: Payments are processed via Stripe...

  H2: 6. Intellectual Property
  PARAGRAPH: BioLinq and its design are property of...

  H2: 7. Limitation of Liability
  PARAGRAPH: BioLinq is provided "as is"...

  H2: 8. Termination
  PARAGRAPH: You may delete your account at any time...
  PARAGRAPH: We may terminate accounts that violate terms...

  H2: 9. Changes to Terms
  PARAGRAPH: We may update these terms...

  H2: 10. Contact
  PARAGRAPH: Questions about terms? Contact...

  FOOTER: Last updated: [DATE]
```

---

### `content/legal/es/terms.md`
**Objective:** Template de Términos de Servicio en español para BioLinq

**Pseudocode:**
```pseudocode
MARKDOWN CONTENT:
  H1: Términos de Servicio

  H2: 1. Aceptación de los Términos
  PARAGRAPH: Al acceder a BioLinq, aceptas estos términos...

  H2: 2. Descripción del Servicio
  PARAGRAPH: BioLinq proporciona un servicio de link-in-bio...

  H2: 3. Cuentas de Usuario
  PARAGRAPH: Debes crear una cuenta mediante Google OAuth...
  PARAGRAPH: Eres responsable de tu cuenta...

  H2: 4. Contenido del Usuario
  PARAGRAPH: Conservas la propiedad de los enlaces que creas...
  PARAGRAPH: No debes publicar contenido ilegal o dañino...

  H2: 5. Funciones Premium
  PARAGRAPH: Las funciones premium están disponibles por pago único...
  PARAGRAPH: Los pagos se procesan a través de Stripe...

  H2: 6. Propiedad Intelectual
  PARAGRAPH: BioLinq y su diseño son propiedad de...

  H2: 7. Limitación de Responsabilidad
  PARAGRAPH: BioLinq se proporciona "tal cual"...

  H2: 8. Terminación
  PARAGRAPH: Puedes eliminar tu cuenta en cualquier momento...
  PARAGRAPH: Podemos terminar cuentas que violen los términos...

  H2: 9. Cambios en los Términos
  PARAGRAPH: Podemos actualizar estos términos...

  H2: 10. Contacto
  PARAGRAPH: ¿Preguntas sobre los términos? Contacta...

  FOOTER: Última actualización: [FECHA]
```

---

### `content/legal/en/privacy.md`
**Objective:** Template de Privacy Policy en inglés para BioLinq

**Pseudocode:**
```pseudocode
MARKDOWN CONTENT:
  H1: Privacy Policy

  H2: 1. Information We Collect
  H3: 1.1 Account Information
  PARAGRAPH: When you sign up with Google OAuth, we receive your name, email, and profile picture...

  H3: 1.2 Usage Data
  PARAGRAPH: We collect analytics about page views, link clicks...

  H3: 1.3 Cookies
  PARAGRAPH: We use cookies for authentication and preferences...

  H2: 2. How We Use Your Information
  PARAGRAPH: To provide and improve the service...
  PARAGRAPH: To process payments via Stripe...
  PARAGRAPH: To send important updates about your account...

  H2: 3. Information Sharing
  PARAGRAPH: We do not sell your personal information...
  PARAGRAPH: We share data with: Stripe (payments), Google (auth), Google Analytics...

  H2: 4. Data Retention
  PARAGRAPH: We retain your data while your account is active...
  PARAGRAPH: You can delete your account and data at any time...

  H2: 5. Your Rights
  PARAGRAPH: Access your data...
  PARAGRAPH: Delete your account...
  PARAGRAPH: Export your data...

  H2: 6. Security
  PARAGRAPH: We implement security measures to protect your data...

  H2: 7. Children's Privacy
  PARAGRAPH: BioLinq is not intended for users under 13...

  H2: 8. Changes to This Policy
  PARAGRAPH: We may update this policy...

  H2: 9. Contact Us
  PARAGRAPH: Questions about privacy? Contact...

  FOOTER: Last updated: [DATE]
```

---

### `content/legal/es/privacy.md`
**Objective:** Template de Política de Privacidad en español para BioLinq

**Pseudocode:**
```pseudocode
MARKDOWN CONTENT:
  H1: Política de Privacidad

  H2: 1. Información que Recopilamos
  H3: 1.1 Información de la Cuenta
  PARAGRAPH: Cuando te registras con Google OAuth, recibimos tu nombre, email y foto de perfil...

  H3: 1.2 Datos de Uso
  PARAGRAPH: Recopilamos analíticas sobre visitas a páginas, clics en enlaces...

  H3: 1.3 Cookies
  PARAGRAPH: Usamos cookies para autenticación y preferencias...

  H2: 2. Cómo Usamos Tu Información
  PARAGRAPH: Para proporcionar y mejorar el servicio...
  PARAGRAPH: Para procesar pagos a través de Stripe...
  PARAGRAPH: Para enviar actualizaciones importantes sobre tu cuenta...

  H2: 3. Compartición de Información
  PARAGRAPH: No vendemos tu información personal...
  PARAGRAPH: Compartimos datos con: Stripe (pagos), Google (auth), Google Analytics...

  H2: 4. Retención de Datos
  PARAGRAPH: Conservamos tus datos mientras tu cuenta esté activa...
  PARAGRAPH: Puedes eliminar tu cuenta y datos en cualquier momento...

  H2: 5. Tus Derechos
  PARAGRAPH: Acceder a tus datos...
  PARAGRAPH: Eliminar tu cuenta...
  PARAGRAPH: Exportar tus datos...

  H2: 6. Seguridad
  PARAGRAPH: Implementamos medidas de seguridad para proteger tus datos...

  H2: 7. Privacidad de Menores
  PARAGRAPH: BioLinq no está destinado a usuarios menores de 13 años...

  H2: 8. Cambios en Esta Política
  PARAGRAPH: Podemos actualizar esta política...

  H2: 9. Contáctanos
  PARAGRAPH: ¿Preguntas sobre privacidad? Contacta...

  FOOTER: Última actualización: [FECHA]
```

---

### `content/legal/en/cookies.md`
**Objective:** Template de Cookie Policy en inglés para BioLinq

**Pseudocode:**
```pseudocode
MARKDOWN CONTENT:
  H1: Cookie Policy

  H2: 1. What Are Cookies
  PARAGRAPH: Cookies are small text files stored on your device...

  H2: 2. How We Use Cookies
  H3: 2.1 Essential Cookies
  PARAGRAPH: Required for the website to function...
  LIST:
    - Session cookie (authentication)
    - Language preference

  H3: 2.2 Analytics Cookies
  PARAGRAPH: Help us understand how you use BioLinq...
  LIST:
    - Google Analytics (_ga, _gid)

  H2: 3. Managing Cookies
  PARAGRAPH: You can control cookies through our consent banner...
  PARAGRAPH: You can also configure your browser settings...

  H2: 4. Third-Party Cookies
  PARAGRAPH: Some cookies are set by third parties...
  LIST:
    - Google Analytics (analytics)
    - Stripe (payment processing)

  H2: 5. Cookie Consent
  PARAGRAPH: We ask for your consent before placing non-essential cookies...
  PARAGRAPH: You can change your preferences at any time...

  H2: 6. Updates to This Policy
  PARAGRAPH: We may update this cookie policy...

  H2: 7. Contact
  PARAGRAPH: Questions about cookies? Contact...

  FOOTER: Last updated: [DATE]
```

---

### `content/legal/es/cookies.md`
**Objective:** Template de Política de Cookies en español para BioLinq

**Pseudocode:**
```pseudocode
MARKDOWN CONTENT:
  H1: Política de Cookies

  H2: 1. ¿Qué Son las Cookies?
  PARAGRAPH: Las cookies son pequeños archivos de texto almacenados en tu dispositivo...

  H2: 2. Cómo Usamos las Cookies
  H3: 2.1 Cookies Esenciales
  PARAGRAPH: Necesarias para que el sitio web funcione...
  LIST:
    - Cookie de sesión (autenticación)
    - Preferencia de idioma

  H3: 2.2 Cookies de Analíticas
  PARAGRAPH: Nos ayudan a entender cómo usas BioLinq...
  LIST:
    - Google Analytics (_ga, _gid)

  H2: 3. Gestión de Cookies
  PARAGRAPH: Puedes controlar las cookies a través de nuestro banner de consentimiento...
  PARAGRAPH: También puedes configurar tu navegador...

  H2: 4. Cookies de Terceros
  PARAGRAPH: Algunas cookies son establecidas por terceros...
  LIST:
    - Google Analytics (analíticas)
    - Stripe (procesamiento de pagos)

  H2: 5. Consentimiento de Cookies
  PARAGRAPH: Pedimos tu consentimiento antes de colocar cookies no esenciales...
  PARAGRAPH: Puedes cambiar tus preferencias en cualquier momento...

  H2: 6. Actualizaciones de Esta Política
  PARAGRAPH: Podemos actualizar esta política de cookies...

  H2: 7. Contacto
  PARAGRAPH: ¿Preguntas sobre cookies? Contacta...

  FOOTER: Última actualización: [FECHA]
```

---

## 4. I18N Section

Esta tarea no añade claves i18n ya que el contenido está en archivos Markdown separados por idioma. Las tareas 11.4-11.6 añadirán claves para títulos de meta tags.

**Nota para tareas posteriores:** La clave `footer_cookies` se añadirá en la tarea 11.6 cuando se actualice el footer.

---

## 5. E2E Test Plan

### Test: Marked package is installed correctly

- **Preconditions:** Fresh npm install after changes
- **Steps:**
  1. Run `npm ls marked`
  2. Check package.json includes marked in dependencies
- **Expected:** marked appears in dependencies list, version matches package.json

### Test: Legal content files exist in both languages

- **Preconditions:** Task completed
- **Steps:**
  1. Check existence of `content/legal/en/terms.md`
  2. Check existence of `content/legal/en/privacy.md`
  3. Check existence of `content/legal/en/cookies.md`
  4. Check existence of `content/legal/es/terms.md`
  5. Check existence of `content/legal/es/privacy.md`
  6. Check existence of `content/legal/es/cookies.md`
- **Expected:** All 6 files exist and are non-empty

### Test: Markdown files have valid structure

- **Preconditions:** Content files created
- **Steps:**
  1. Read each markdown file
  2. Verify it starts with H1 (# Title)
  3. Verify it contains at least 3 H2 sections (## Section)
- **Expected:** All files have proper markdown structure with H1 title and multiple sections

**Nota:** Estos tests se pueden ejecutar como verificaciones de build o scripts, no necesitan ser E2E con Playwright ya que son archivos estáticos. La verificación E2E real de las páginas se hará en tareas 11.4-11.6 cuando existan las rutas.

---

## 6. Implementation Checklist

1. [ ] Ejecutar `npm install marked`
2. [ ] Crear directorio `content/legal/en/`
3. [ ] Crear directorio `content/legal/es/`
4. [ ] Crear `content/legal/en/terms.md` con contenido template
5. [ ] Crear `content/legal/es/terms.md` con contenido template
6. [ ] Crear `content/legal/en/privacy.md` con contenido template
7. [ ] Crear `content/legal/es/privacy.md` con contenido template
8. [ ] Crear `content/legal/en/cookies.md` con contenido template
9. [ ] Crear `content/legal/es/cookies.md` con contenido template
10. [ ] Verificar que `npm run typecheck` pasa
11. [ ] Verificar que `npm run lint` pasa
