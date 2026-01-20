# FEATURE_6.1_CustomDomains.md

## 1. Natural Language Description

### Current State
- Users have public profiles at `biolinq.page/:username`
- The `biolinks` table stores user profiles with a unique `username`
- Public route (`app/routes/public.tsx`) resolves profiles by `params.username`
- No support for custom domains exists
- Premium users can customize themes and colors

### Expected End State
- Premium users can configure a custom domain (e.g., `links.userwebsite.com`) in the dashboard
- When visitors access `links.userwebsite.com`, they see the user's BioLinq profile
- The system integrates with Netlify's API to register domain aliases automatically
- DNS verification ensures only domain owners can claim a domain
- Custom domains are a premium-only feature

### User Flow
1. User enters custom domain in dashboard (e.g., `links.mydomain.com`)
2. System validates format and checks uniqueness
3. System calls Netlify API to add domain alias
4. User configures CNAME record: `links.mydomain.com → biolinq.netlify.app`
5. Netlify provisions SSL automatically
6. System verifies DNS configuration
7. Once verified, visitors to `links.mydomain.com` see the user's profile

---

## 2. Technical Description

### Core Challenge: Resolving Custom Domains

The key technical challenge is detecting when a request comes from a custom domain vs. the main domain:

```
Request to biolinq.page/alice     → resolve by params.username = 'alice'
Request to links.usersite.com     → resolve by request.host = 'links.usersite.com'
```

**Solution:** Modify the public route loader to:
1. Check if `request.host` matches a custom domain in the database
2. If yes, load that biolink (ignore URL path)
3. If no, fall back to current `params.username` resolution

### Netlify API Integration

Netlify's domain alias API has a critical quirk: **it replaces the entire list, not appends**.

```
GET /api/v1/sites/{site_id} → returns current domain_aliases[]
PATCH /api/v1/sites/{site_id} → set domain_aliases to NEW complete list
```

**Workflow to add a domain:**
1. GET current site → extract `domain_aliases`
2. Append new domain to list
3. PATCH site with updated list

**Workflow to remove a domain:**
1. GET current site → extract `domain_aliases`
2. Filter out the domain
3. PATCH site with updated list

### DNS Verification Strategy

**Simple approach (recommended for MVP):**
- After user adds domain, check if CNAME resolves to Netlify
- Netlify handles SSL provisioning automatically
- Mark domain as "verified" once Netlify confirms it

**Verification flow:**
1. User saves domain → stored with `verified = false`
2. Background check: DNS lookup for CNAME
3. If CNAME points to Netlify → mark `verified = true`
4. Only verified domains are resolved in public route

### Architecture Decisions

1. **New service:** `app/services/custom-domain.server.ts` - business logic
2. **New service:** `app/services/netlify.server.ts` - Netlify API wrapper
3. **Schema change:** Add `customDomain` and `customDomainVerified` to `biolinks`
4. **Route modification:** Update `public.tsx` loader to check host
5. **Dashboard component:** New `CustomDomainSection` component

### Environment Variables Required

| Variable | Purpose | Example |
|----------|---------|---------|
| `NETLIFY_API_TOKEN` | Authenticate with Netlify API | `nfp_xxx...` |
| `NETLIFY_SITE_ID` | Identify the site to modify | `abc123-def456` |

---

## 2.1. Architecture Gate

- **Pages are puzzles:** Dashboard route composes `CustomDomainSection` component; public route only calls services.
- **Loaders/actions are thin:**
  - Dashboard action parses intent, calls `customDomainService`, returns result
  - Public loader checks host, calls resolution service, returns data
- **Business logic is not in components:**
  - Domain validation, Netlify API calls, DNS verification → `app/services/custom-domain.server.ts`
  - Netlify HTTP calls → `app/services/netlify.server.ts`
  - UI state/form handling → `app/hooks/useCustomDomain.ts` (optional, if complex)

---

## 3. Files to Change/Create

### 3.1 Database Migration

#### `drizzle/migrations/XXXX_add_custom_domain.sql`
**Objective:** Add custom domain fields to biolinks table.

**SQL:**
```sql
ALTER TABLE biolinks
ADD COLUMN custom_domain VARCHAR(255) UNIQUE,
ADD COLUMN custom_domain_verified BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_biolinks_custom_domain ON biolinks(custom_domain) WHERE custom_domain IS NOT NULL;
```

---

### 3.2 Schema Update

#### `app/db/schema/biolinks.ts`
**Objective:** Add TypeScript types for new columns.

**Pseudocode:**
```pseudocode
ADD TO biolinks TABLE DEFINITION:
  customDomain: varchar('custom_domain', { length: 255 }).unique()
  customDomainVerified: boolean('custom_domain_verified').default(false)
```

---

### 3.3 Netlify Service

#### `app/services/netlify.server.ts`
**Objective:** Wrap Netlify API for domain alias management.

**Pseudocode:**
```pseudocode
IMPORTS
  env variables: NETLIFY_API_TOKEN, NETLIFY_SITE_ID

CONSTANTS
  NETLIFY_API_BASE = 'https://api.netlify.com/api/v1'

TYPES
  NetlifyError = 'API_ERROR' | 'UNAUTHORIZED' | 'RATE_LIMITED' | 'NETWORK_ERROR'

  GetSiteResult =
    | { success: true; domainAliases: string[] }
    | { success: false; error: NetlifyError }

  UpdateDomainsResult =
    | { success: true }
    | { success: false; error: NetlifyError }

// ============================================
// FUNCTION: Get current domain aliases
// ============================================
FUNCTION getCurrentDomainAliases(): Promise<GetSiteResult>
  TRY
    response = FETCH GET `${NETLIFY_API_BASE}/sites/${NETLIFY_SITE_ID}`
      HEADERS: Authorization: Bearer ${NETLIFY_API_TOKEN}

    IF response.status === 401
      RETURN { success: false, error: 'UNAUTHORIZED' }
    IF response.status === 429
      RETURN { success: false, error: 'RATE_LIMITED' }
    IF NOT response.ok
      RETURN { success: false, error: 'API_ERROR' }

    data = await response.json()
    RETURN { success: true, domainAliases: data.domain_aliases || [] }
  CATCH
    RETURN { success: false, error: 'NETWORK_ERROR' }
END

// ============================================
// FUNCTION: Update domain aliases (replace entire list)
// ============================================
FUNCTION updateDomainAliases(newAliases: string[]): Promise<UpdateDomainsResult>
  TRY
    response = FETCH PATCH `${NETLIFY_API_BASE}/sites/${NETLIFY_SITE_ID}`
      HEADERS:
        Authorization: Bearer ${NETLIFY_API_TOKEN}
        Content-Type: application/json
      BODY: JSON.stringify({ domain_aliases: newAliases })

    IF response.status === 401
      RETURN { success: false, error: 'UNAUTHORIZED' }
    IF response.status === 429
      RETURN { success: false, error: 'RATE_LIMITED' }
    IF NOT response.ok
      RETURN { success: false, error: 'API_ERROR' }

    RETURN { success: true }
  CATCH
    RETURN { success: false, error: 'NETWORK_ERROR' }
END

// ============================================
// FUNCTION: Add a single domain alias
// ============================================
FUNCTION addDomainAlias(domain: string): Promise<UpdateDomainsResult>
  // Get current list
  currentResult = await getCurrentDomainAliases()
  IF NOT currentResult.success
    RETURN currentResult

  // Check if already exists
  IF domain IN currentResult.domainAliases
    RETURN { success: true } // Already added, idempotent

  // Add to list and update
  newList = [...currentResult.domainAliases, domain]
  RETURN await updateDomainAliases(newList)
END

// ============================================
// FUNCTION: Remove a single domain alias
// ============================================
FUNCTION removeDomainAlias(domain: string): Promise<UpdateDomainsResult>
  // Get current list
  currentResult = await getCurrentDomainAliases()
  IF NOT currentResult.success
    RETURN currentResult

  // Filter out the domain
  newList = currentResult.domainAliases.filter(d => d !== domain)

  // If domain wasn't in list, return success (idempotent)
  IF newList.length === currentResult.domainAliases.length
    RETURN { success: true }

  RETURN await updateDomainAliases(newList)
END

EXPORT getCurrentDomainAliases, addDomainAlias, removeDomainAlias
```

---

### 3.4 Custom Domain Service

#### `app/services/custom-domain.server.ts`
**Objective:** Business logic for custom domain management.

**Pseudocode:**
```pseudocode
IMPORTS
  db from ~/db
  biolinks from ~/db/schema/biolinks
  users from ~/db/schema/users
  eq from drizzle-orm
  addDomainAlias, removeDomainAlias from ./netlify.server
  dns from node:dns/promises (for verification)

TYPES
  CustomDomainError =
    | 'PREMIUM_REQUIRED'
    | 'INVALID_DOMAIN_FORMAT'
    | 'DOMAIN_ALREADY_TAKEN'
    | 'BIOLINK_NOT_FOUND'
    | 'NETLIFY_ERROR'
    | 'DOMAIN_NOT_SET'

  SetDomainResult =
    | { success: true; domain: string }
    | { success: false; error: CustomDomainError }

  RemoveDomainResult =
    | { success: true }
    | { success: false; error: CustomDomainError }

  VerifyDomainResult =
    | { success: true; verified: boolean }
    | { success: false; error: CustomDomainError }

  ResolveDomainResult =
    | { success: true; biolink: Biolink; user: User }
    | { success: false }

CONSTANTS
  // Valid domain format: subdomain.domain.tld or domain.tld
  DOMAIN_REGEX = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i

  // Domains that should never be allowed
  BLOCKED_DOMAINS = ['biolinq.page', 'biolinq.netlify.app', 'netlify.app', 'netlify.com']

FUNCTION isValidDomainFormat(domain: string): boolean
  IF NOT DOMAIN_REGEX.test(domain)
    RETURN false
  // Block our own domains
  FOR blocked IN BLOCKED_DOMAINS
    IF domain === blocked OR domain.endsWith('.' + blocked)
      RETURN false
  RETURN true
END

// ============================================
// FUNCTION: Set custom domain for a biolink
// ============================================
FUNCTION setCustomDomain(
  userId: string,
  biolinkId: string,
  domain: string
): Promise<SetDomainResult>

  // Normalize domain (lowercase, trim)
  normalizedDomain = domain.toLowerCase().trim()

  // Validate format
  IF NOT isValidDomainFormat(normalizedDomain)
    RETURN { success: false, error: 'INVALID_DOMAIN_FORMAT' }

  // Check premium status
  userResult = SELECT isPremium FROM users WHERE id = userId
  IF userResult IS empty OR NOT userResult.isPremium
    RETURN { success: false, error: 'PREMIUM_REQUIRED' }

  // Check biolink exists and belongs to user
  biolinkResult = SELECT id, customDomain FROM biolinks
                  WHERE id = biolinkId AND userId = userId
  IF biolinkResult IS empty
    RETURN { success: false, error: 'BIOLINK_NOT_FOUND' }

  // Check if domain is already taken by another biolink
  existingResult = SELECT id FROM biolinks
                   WHERE customDomain = normalizedDomain AND id != biolinkId
  IF existingResult IS NOT empty
    RETURN { success: false, error: 'DOMAIN_ALREADY_TAKEN' }

  // If changing domain, remove old one from Netlify first
  oldDomain = biolinkResult.customDomain
  IF oldDomain AND oldDomain !== normalizedDomain
    await removeDomainAlias(oldDomain) // Best effort, don't fail if this errors

  // Add new domain to Netlify
  netlifyResult = await addDomainAlias(normalizedDomain)
  IF NOT netlifyResult.success
    RETURN { success: false, error: 'NETLIFY_ERROR' }

  // Save to database (unverified initially)
  UPDATE biolinks
  SET customDomain = normalizedDomain,
      customDomainVerified = false,
      updatedAt = new Date()
  WHERE id = biolinkId

  RETURN { success: true, domain: normalizedDomain }
END

// ============================================
// FUNCTION: Remove custom domain from biolink
// ============================================
FUNCTION removeCustomDomain(
  userId: string,
  biolinkId: string
): Promise<RemoveDomainResult>

  // Get current domain
  biolinkResult = SELECT id, customDomain FROM biolinks
                  WHERE id = biolinkId AND userId = userId
  IF biolinkResult IS empty
    RETURN { success: false, error: 'BIOLINK_NOT_FOUND' }

  IF biolinkResult.customDomain IS null
    RETURN { success: false, error: 'DOMAIN_NOT_SET' }

  // Remove from Netlify
  netlifyResult = await removeDomainAlias(biolinkResult.customDomain)
  IF NOT netlifyResult.success
    RETURN { success: false, error: 'NETLIFY_ERROR' }

  // Clear from database
  UPDATE biolinks
  SET customDomain = null,
      customDomainVerified = false,
      updatedAt = new Date()
  WHERE id = biolinkId

  RETURN { success: true }
END

// ============================================
// FUNCTION: Verify domain DNS configuration
// ============================================
FUNCTION verifyCustomDomain(
  userId: string,
  biolinkId: string
): Promise<VerifyDomainResult>

  // Get domain
  biolinkResult = SELECT id, customDomain FROM biolinks
                  WHERE id = biolinkId AND userId = userId
  IF biolinkResult IS empty
    RETURN { success: false, error: 'BIOLINK_NOT_FOUND' }

  IF biolinkResult.customDomain IS null
    RETURN { success: false, error: 'DOMAIN_NOT_SET' }

  TRY
    // Check CNAME record
    cnameRecords = await dns.resolveCname(biolinkResult.customDomain)

    // Check if any CNAME points to Netlify
    pointsToNetlify = cnameRecords.some(record =>
      record.includes('netlify') OR record.endsWith('.netlify.app')
    )

    IF pointsToNetlify
      UPDATE biolinks SET customDomainVerified = true WHERE id = biolinkId
      RETURN { success: true, verified: true }
    ELSE
      RETURN { success: true, verified: false }
  CATCH (error)
    // DNS lookup failed (domain not configured or doesn't exist)
    RETURN { success: true, verified: false }
END

// ============================================
// FUNCTION: Resolve biolink by custom domain (for public route)
// ============================================
FUNCTION getBiolinkByCustomDomain(domain: string): Promise<ResolveDomainResult>
  normalizedDomain = domain.toLowerCase().trim()

  result = SELECT biolinks.*, users.name, users.image, users.isPremium
           FROM biolinks
           JOIN users ON biolinks.userId = users.id
           WHERE biolinks.customDomain = normalizedDomain
             AND biolinks.customDomainVerified = true
           LIMIT 1

  IF result IS empty
    RETURN { success: false }

  RETURN {
    success: true,
    biolink: result.biolink,
    user: { name: result.name, image: result.image, isPremium: result.isPremium }
  }
END

EXPORT setCustomDomain, removeCustomDomain, verifyCustomDomain, getBiolinkByCustomDomain
```

---

### 3.5 Public Route Modification

#### `app/routes/public.tsx`
**Objective:** Modify loader to resolve by custom domain when applicable.

**Pseudocode:**
```pseudocode
// Add to existing imports
IMPORT getBiolinkByCustomDomain from ~/services/custom-domain.server

// Add helper function
FUNCTION isCustomDomain(host: string): boolean
  // Check if host is NOT the main biolinq domain
  mainDomains = ['biolinq.page', 'www.biolinq.page', 'localhost', '127.0.0.1']
  RETURN NOT mainDomains.some(d => host === d OR host.startsWith(d + ':'))
END

// Modify loader
FUNCTION loader({ params, request })
  url = new URL(request.url)
  host = url.host // e.g., 'links.usersite.com' or 'biolinq.page'

  // STEP 1: Check for custom domain
  IF isCustomDomain(host)
    customDomainResult = await getBiolinkByCustomDomain(host)
    IF customDomainResult.success
      // Custom domain found and verified - serve this profile
      links = await getPublicLinksByBiolinkId(customDomainResult.biolink.id)

      // Track view (same logic as before)
      ...tracking code...

      RETURN data({
        biolink: customDomainResult.biolink,
        user: customDomainResult.user,
        links,
        isPreview: false,
        isCustomDomain: true
      })
    // If custom domain not found/verified, fall through to 404
    THROW new Response('Not Found', { status: 404 })

  // STEP 2: Fall back to username resolution (existing logic)
  username = params.username
  IF NOT username
    THROW new Response('Not Found', { status: 404 })

  result = await getBiolinkWithUserByUsername(username)
  IF NOT result
    THROW new Response('Not Found', { status: 404 })

  // ... rest of existing loader code ...

  RETURN data({
    ...existing data...,
    isCustomDomain: false
  })
END
```

---

### 3.6 Dashboard Route Modification

#### `app/routes/dashboard.tsx`
**Objective:** Add custom domain action handling.

**Pseudocode:**
```pseudocode
// Add to imports
IMPORT { setCustomDomain, removeCustomDomain, verifyCustomDomain } from ~/services/custom-domain.server

// Add to loader return
RETURN {
  ...existing data...,
  biolink: {
    ...biolink,
    customDomain: biolink.customDomain,
    customDomainVerified: biolink.customDomainVerified
  }
}

// Add to action function
IF intent === 'setCustomDomain'
  domain = formData.get('domain') as string
  biolinkId = formData.get('biolinkId') as string

  result = await setCustomDomain(authSession.user.id, biolinkId, domain)

  IF NOT result.success
    RETURN data({ error: result.error })

  RETURN redirect('/dashboard')

IF intent === 'removeCustomDomain'
  biolinkId = formData.get('biolinkId') as string

  result = await removeCustomDomain(authSession.user.id, biolinkId)

  IF NOT result.success
    RETURN data({ error: result.error })

  RETURN redirect('/dashboard')

IF intent === 'verifyCustomDomain'
  biolinkId = formData.get('biolinkId') as string

  result = await verifyCustomDomain(authSession.user.id, biolinkId)

  IF NOT result.success
    RETURN data({ error: result.error })

  // Return verification status without redirect (for inline feedback)
  RETURN data({ verified: result.verified })
```

---

### 3.7 Dashboard Component

#### `app/components/dashboard/CustomDomainSection.tsx`
**Objective:** UI for managing custom domain.

**Pseudocode:**
```pseudocode
COMPONENT CustomDomainSection
  PROPS:
    biolinkId: string
    customDomain: string | null
    customDomainVerified: boolean
    isPremium: boolean

  STATE:
    domainInput: string (initialized to customDomain or '')
    isVerifying: boolean = false

  HOOKS:
    { t } = useTranslation()
    fetcher = useFetcher()

  // Handle verification check
  EFFECT: when fetcher.data changes
    IF fetcher.data?.verified !== undefined
      setIsVerifying(false)

  RENDER:
    IF NOT isPremium
      // Show locked state with premium badge
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle>{t('custom_domain_title')}</CardTitle>
          <PremiumBadge />
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('custom_domain_premium_required')}</p>
        </CardContent>
      </Card>
      RETURN

    <Card>
      <CardHeader>
        <CardTitle>{t('custom_domain_title')}</CardTitle>
        <CardDescription>{t('custom_domain_description')}</CardDescription>
      </CardHeader>

      <CardContent>
        IF customDomain
          // Domain is set - show status and management
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-mono">{customDomain}</span>
              IF customDomainVerified
                <Badge variant="success">{t('custom_domain_verified')}</Badge>
              ELSE
                <Badge variant="warning">{t('custom_domain_pending')}</Badge>
            </div>

            IF NOT customDomainVerified
              // Show DNS instructions
              <Alert>
                <AlertTitle>{t('custom_domain_dns_title')}</AlertTitle>
                <AlertDescription>
                  <p>{t('custom_domain_dns_instruction')}</p>
                  <code className="block mt-2 p-2 bg-muted rounded">
                    CNAME {customDomain} → biolinq.netlify.app
                  </code>
                </AlertDescription>
              </Alert>

              // Verify button
              <fetcher.Form method="post">
                <input type="hidden" name="intent" value="verifyCustomDomain" />
                <input type="hidden" name="biolinkId" value={biolinkId} />
                <Button
                  type="submit"
                  variant="outline"
                  disabled={fetcher.state !== 'idle'}
                >
                  {fetcher.state !== 'idle' ? t('custom_domain_verifying') : t('custom_domain_verify')}
                </Button>
              </fetcher.Form>

            // Remove button
            <fetcher.Form method="post">
              <input type="hidden" name="intent" value="removeCustomDomain" />
              <input type="hidden" name="biolinkId" value={biolinkId} />
              <Button type="submit" variant="destructive" size="sm">
                {t('custom_domain_remove')}
              </Button>
            </fetcher.Form>
          </div>

        ELSE
          // No domain set - show form to add
          <fetcher.Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="setCustomDomain" />
            <input type="hidden" name="biolinkId" value={biolinkId} />

            <div>
              <Label htmlFor="domain">{t('custom_domain_label')}</Label>
              <Input
                id="domain"
                name="domain"
                type="text"
                placeholder="links.yourdomain.com"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {t('custom_domain_hint')}
              </p>
            </div>

            IF fetcher.data?.error
              <Alert variant="destructive">
                {t(`custom_domain_error_${fetcher.data.error}`)}
              </Alert>

            <Button
              type="submit"
              disabled={!domainInput || fetcher.state !== 'idle'}
            >
              {fetcher.state !== 'idle' ? t('saving') : t('custom_domain_save')}
            </Button>
          </fetcher.Form>
      </CardContent>
    </Card>
END

EXPORT CustomDomainSection
```

---

### 3.8 Dashboard Layout Update

#### `app/routes/dashboard.tsx` (component section)
**Objective:** Add CustomDomainSection to dashboard layout.

**Pseudocode:**
```pseudocode
// Add to component imports
IMPORT { CustomDomainSection } from '~/components/dashboard'

// Add in left column, after CustomizationSection
<CustomDomainSection
  biolinkId={biolink.id}
  customDomain={biolink.customDomain}
  customDomainVerified={biolink.customDomainVerified}
  isPremium={user.isPremium}
/>
```

---

## 4. I18N

### New keys to create

| Key | English | Spanish |
|-----|---------|---------|
| `custom_domain_title` | Custom Domain | Dominio Personalizado |
| `custom_domain_description` | Use your own domain for your BioLinq page | Usa tu propio dominio para tu pagina BioLinq |
| `custom_domain_premium_required` | Custom domains are available for Premium users | Los dominios personalizados estan disponibles para usuarios Premium |
| `custom_domain_label` | Your domain | Tu dominio |
| `custom_domain_hint` | Enter a subdomain like links.yourdomain.com | Introduce un subdominio como links.tudominio.com |
| `custom_domain_save` | Add Domain | Agregar Dominio |
| `custom_domain_verified` | Verified | Verificado |
| `custom_domain_pending` | Pending verification | Pendiente de verificacion |
| `custom_domain_dns_title` | DNS Configuration Required | Configuracion DNS Requerida |
| `custom_domain_dns_instruction` | Add this CNAME record in your DNS provider: | Agrega este registro CNAME en tu proveedor DNS: |
| `custom_domain_verify` | Check DNS | Verificar DNS |
| `custom_domain_verifying` | Checking... | Verificando... |
| `custom_domain_remove` | Remove Domain | Eliminar Dominio |
| `custom_domain_error_PREMIUM_REQUIRED` | Custom domains require Premium | Los dominios personalizados requieren Premium |
| `custom_domain_error_INVALID_DOMAIN_FORMAT` | Invalid domain format | Formato de dominio invalido |
| `custom_domain_error_DOMAIN_ALREADY_TAKEN` | This domain is already in use | Este dominio ya esta en uso |
| `custom_domain_error_NETLIFY_ERROR` | Could not configure domain. Please try again. | No se pudo configurar el dominio. Intenta de nuevo. |
| `custom_domain_error_DOMAIN_NOT_SET` | No custom domain is configured | No hay dominio personalizado configurado |

---

## 5. E2E Test Plan

### Test: Premium user can set a custom domain
- **Preconditions:** Premium user logged in, has biolink, no custom domain set
- **Steps:**
  1. Navigate to `/dashboard`
  2. Scroll to Custom Domain section
  3. Enter `test-domain.example.com` in the domain input
  4. Click "Add Domain"
- **Expected:**
  - Domain is saved
  - DNS instructions appear
  - "Pending verification" badge shows

### Test: Free user cannot access custom domain feature
- **Preconditions:** Free user logged in, has biolink
- **Steps:**
  1. Navigate to `/dashboard`
  2. Look for Custom Domain section
- **Expected:**
  - Section shows locked/disabled state
  - Premium badge visible
  - No input field available

### Test: Invalid domain format is rejected
- **Preconditions:** Premium user logged in, has biolink
- **Steps:**
  1. Navigate to `/dashboard`
  2. Enter `not a valid domain` in domain input
  3. Click "Add Domain"
- **Expected:** Error message "Invalid domain format"

### Test: Duplicate domain is rejected
- **Preconditions:**
  - Premium user A has `test.example.com` configured
  - Premium user B logged in, has biolink
- **Steps:**
  1. User B navigates to `/dashboard`
  2. Enter `test.example.com`
  3. Click "Add Domain"
- **Expected:** Error message "This domain is already in use"

### Test: User can remove custom domain
- **Preconditions:** Premium user logged in, has custom domain set
- **Steps:**
  1. Navigate to `/dashboard`
  2. Click "Remove Domain"
- **Expected:**
  - Domain is removed
  - Input form appears again

### Test: Verified custom domain resolves to user profile
- **Preconditions:**
  - Premium user has `links.testuser.com` verified
  - DNS properly configured (mock in test)
- **Steps:**
  1. Make request to app with `Host: links.testuser.com`
- **Expected:**
  - User's public profile renders
  - Correct biolink data displayed

### Test: Unverified custom domain returns 404
- **Preconditions:**
  - Premium user has `links.testuser.com` set but NOT verified
- **Steps:**
  1. Make request to app with `Host: links.testuser.com`
- **Expected:** 404 Not Found

### Test: Unknown custom domain returns 404
- **Preconditions:** None
- **Steps:**
  1. Make request to app with `Host: unknown.domain.com`
- **Expected:** 404 Not Found

---

## 6. Environment Setup

### Required Environment Variables

Add to `.env.development` and production environment:

```bash
# Netlify API (get from Netlify dashboard > User settings > Applications > Personal access tokens)
NETLIFY_API_TOKEN=nfp_xxxxxxxxxxxx

# Netlify Site ID (get from Netlify dashboard > Site settings > General > Site ID)
NETLIFY_SITE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Netlify API Token Permissions

The token needs these permissions:
- Read site information
- Update site settings

Generate at: https://app.netlify.com/user/applications#personal-access-tokens

---

## 7. Implementation Notes

### Answering the Original Question

> Lo que mas dudas me genera es como llamar a la API de netlify desde el action de la pagina

**Answer:** The action does NOT call Netlify directly. The action calls the service:

```typescript
// In dashboard.tsx action:
if (intent === 'setCustomDomain') {
  const result = await setCustomDomain(userId, biolinkId, domain)
  // setCustomDomain internally calls netlify.server.ts
}
```

```typescript
// In custom-domain.server.ts:
import { addDomainAlias } from './netlify.server'

export async function setCustomDomain(...) {
  // ... validation ...
  const netlifyResult = await addDomainAlias(domain)
  // ... save to DB ...
}
```

```typescript
// In netlify.server.ts:
export async function addDomainAlias(domain: string) {
  const response = await fetch(`https://api.netlify.com/api/v1/sites/${SITE_ID}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ domain_aliases: [...currentAliases, domain] })
  })
  // ...
}
```

The service layer isolates the Netlify API complexity from the route action.

### Error Handling Strategy

1. **Netlify API fails:** Roll back DB changes, return error to user
2. **DNS not configured:** Domain saved but marked unverified; user sees instructions
3. **SSL provisioning:** Handled automatically by Netlify after DNS verification

### Security Considerations

1. **Domain ownership:** Only verified domains (DNS points to Netlify) can serve content
2. **Domain squatting:** Blocked domains list prevents claiming biolinq.page subdomains
3. **Rate limiting:** Netlify API has rate limits; service should handle 429 responses gracefully
