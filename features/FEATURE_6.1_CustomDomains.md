# FEATURE_6.1_CustomDomains.md

## ✅ IMPLEMENTATION STATUS: 100% COMPLETE

**Verificado en producción: Sin fallos ✅**

---

## 0. Architecture Summary

**Key Decisions:**
1. **Two-phase DNS verification**: TXT record challenge → Netlify API call → CNAME verification
2. **Home route handles custom domains**: `app/routes/home.tsx` checks `request.host` and conditionally renders profile or landing
3. **Reuse existing components**: `PublicProfile` component serves both `/:username` and custom domain profiles

**Why this approach?**
- **Security**: TXT challenge prevents domain squatting
- **Resource efficiency**: Only verified domains consume Netlify aliases
- **Simplicity**: No middleware needed, home route is the natural entry point for custom domains
- **Code reuse**: Same `PublicProfile` component for all public views

---

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
3. System generates a unique verification token and displays a TXT record challenge
4. User adds TXT record to DNS: `_biolinq-verify.links.mydomain.com → {verification_token}`
5. User clicks "Verify Domain Ownership"
6. System checks TXT record exists and matches token
7. Once verified, system calls Netlify API to add domain alias
8. User configures CNAME record: `links.mydomain.com → biolinq.page`
9. Netlify provisions SSL automatically
10. Once CNAME is detected, visitors to `links.mydomain.com` see the user's profile

---

## 2. Technical Description

### Core Challenge: Resolving Custom Domains

The key technical challenge is detecting when a request comes from a custom domain vs. the main domain:

```
Request to biolinq.page/          → home route → render landing page
Request to biolinq.page/alice     → public route → resolve by params.username = 'alice'
Request to links.usersite.com/    → home route → resolve by request.host, render profile
```

**Solution:** Modify the home route loader (`/`) to:
1. Check if `request.host` matches a custom domain in the database
2. If yes, load that biolink and render the public profile view
3. If no, render the normal landing page

This approach is simpler than creating middleware and keeps responsibilities clear:
- Home route: Landing page OR custom domain profiles
- Public route: Username-based profiles on main domain

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

**Two-phase verification approach:**

**Phase 1: Domain Ownership (TXT Record Challenge)**
- When user adds domain, generate unique verification token
- Store token in DB with domain: `domainVerificationToken`
- User must add TXT record: `_biolinq-verify.{domain} → {token}`
- System verifies TXT record exists and matches before calling Netlify
- Prevents domain squatting and Netlify alias exhaustion

**Phase 2: CNAME Configuration (Traffic Routing)**
- After ownership verified, system calls Netlify API to add alias
- User configures CNAME: `{domain} → biolinq.page`
- System checks CNAME resolves correctly
- Mark domain as `cnameVerified = true` once DNS propagates
- Only domains with both ownership + CNAME verified can serve traffic

**Why two phases?**
1. **Prevents abuse:** Can't claim domains you don't own
2. **Saves Netlify resources:** Only add aliases for verified domains
3. **Better UX:** Clear separation between "prove ownership" and "configure routing"

**Verification states:**
- `domainOwnershipVerified = false, cnameVerified = false` → Pending TXT record
- `domainOwnershipVerified = true, cnameVerified = false` → Pending CNAME record
- `domainOwnershipVerified = true, cnameVerified = true` → Live and serving traffic

### Architecture Decisions

1. **New service:** `app/services/custom-domain.server.ts` - business logic
2. **New service:** `app/services/netlify.server.ts` - Netlify API wrapper
3. **Schema change:** Add custom domain fields to `biolinks` table
4. **Route modification:** Update `home.tsx` loader to check host and conditionally render profile
5. **Dashboard component:** New `CustomDomainSection` component
6. **Component reuse:** Use existing `PublicProfile` component to render custom domain profiles

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

**Summary:**
1. **New files**: `app/services/netlify.server.ts`, `app/services/custom-domain.server.ts`, `app/components/dashboard/CustomDomainSection.tsx`, migration SQL
2. **Modified files**: `app/db/schema/biolinks.ts`, `app/routes/home.tsx`, `app/routes/dashboard.tsx`, i18n files
3. **Reused components**: `PublicProfile` component (no changes needed)

---

### 3.1 Database Migration

#### `drizzle/migrations/XXXX_add_custom_domain.sql`
**Objective:** Add custom domain fields to biolinks table.

**SQL:**
```sql
ALTER TABLE biolinks
ADD COLUMN custom_domain VARCHAR(255) UNIQUE,
ADD COLUMN domain_verification_token VARCHAR(64),
ADD COLUMN domain_ownership_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN cname_verified BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_biolinks_custom_domain ON biolinks(custom_domain) WHERE custom_domain IS NOT NULL;

-- Index for efficient lookup by verified domains
CREATE INDEX idx_biolinks_verified_domains ON biolinks(custom_domain)
WHERE domain_ownership_verified = TRUE AND cname_verified = TRUE;
```

---

### 3.2 Schema Update

#### `app/db/schema/biolinks.ts`
**Objective:** Add TypeScript types for new columns.

**Pseudocode:**
```pseudocode
ADD TO biolinks TABLE DEFINITION:
  customDomain: varchar('custom_domain', { length: 255 }).unique()
  domainVerificationToken: varchar('domain_verification_token', { length: 64 })
  domainOwnershipVerified: boolean('domain_ownership_verified').default(false)
  cnameVerified: boolean('cname_verified').default(false)
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
  crypto from node:crypto (for token generation)

TYPES
  CustomDomainError =
    | 'PREMIUM_REQUIRED'
    | 'INVALID_DOMAIN_FORMAT'
    | 'DOMAIN_ALREADY_TAKEN'
    | 'BIOLINK_NOT_FOUND'
    | 'NETLIFY_ERROR'
    | 'DOMAIN_NOT_SET'
    | 'OWNERSHIP_NOT_VERIFIED'
    | 'TXT_RECORD_NOT_FOUND'
    | 'TXT_RECORD_MISMATCH'

  SetDomainResult =
    | { success: true; domain: string; verificationToken: string }
    | { success: false; error: CustomDomainError }

  RemoveDomainResult =
    | { success: true }
    | { success: false; error: CustomDomainError }

  VerifyOwnershipResult =
    | { success: true; verified: boolean }
    | { success: false; error: CustomDomainError }

  VerifyCNAMEResult =
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
// FUNCTION: Generate verification token
// ============================================
FUNCTION generateVerificationToken(): string
  // Generate a random 32-byte token
  RETURN crypto.randomBytes(32).toString('hex')
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

  // Generate verification token
  verificationToken = generateVerificationToken()

  // Save to database (ownership unverified initially)
  // DO NOT call Netlify yet - that happens after ownership verification
  UPDATE biolinks
  SET customDomain = normalizedDomain,
      domainVerificationToken = verificationToken,
      domainOwnershipVerified = false,
      cnameVerified = false,
      updatedAt = new Date()
  WHERE id = biolinkId

  RETURN { success: true, domain: normalizedDomain, verificationToken }
END

// ============================================
// FUNCTION: Remove custom domain from biolink
// ============================================
FUNCTION removeCustomDomain(
  userId: string,
  biolinkId: string
): Promise<RemoveDomainResult>

  // Get current domain
  biolinkResult = SELECT id, customDomain, domainOwnershipVerified
                  FROM biolinks
                  WHERE id = biolinkId AND userId = userId
  IF biolinkResult IS empty
    RETURN { success: false, error: 'BIOLINK_NOT_FOUND' }

  IF biolinkResult.customDomain IS null
    RETURN { success: false, error: 'DOMAIN_NOT_SET' }

  // Only remove from Netlify if ownership was verified
  // (otherwise it was never added to Netlify)
  IF biolinkResult.domainOwnershipVerified
    netlifyResult = await removeDomainAlias(biolinkResult.customDomain)
    IF NOT netlifyResult.success
      RETURN { success: false, error: 'NETLIFY_ERROR' }

  // Clear from database
  UPDATE biolinks
  SET customDomain = null,
      domainVerificationToken = null,
      domainOwnershipVerified = false,
      cnameVerified = false,
      updatedAt = new Date()
  WHERE id = biolinkId

  RETURN { success: true }
END

// ============================================
// FUNCTION: Verify domain ownership (TXT record challenge)
// ============================================
FUNCTION verifyDomainOwnership(
  userId: string,
  biolinkId: string
): Promise<VerifyOwnershipResult>

  // Get domain and token
  biolinkResult = SELECT id, customDomain, domainVerificationToken
                  FROM biolinks
                  WHERE id = biolinkId AND userId = userId
  IF biolinkResult IS empty
    RETURN { success: false, error: 'BIOLINK_NOT_FOUND' }

  IF biolinkResult.customDomain IS null
    RETURN { success: false, error: 'DOMAIN_NOT_SET' }

  domain = biolinkResult.customDomain
  expectedToken = biolinkResult.domainVerificationToken

  TRY
    // Look up TXT record at _biolinq-verify.{domain}
    verificationHost = `_biolinq-verify.${domain}`
    txtRecords = await dns.resolveTxt(verificationHost)

    // TXT records come as array of arrays, flatten them
    allRecords = txtRecords.flat()

    // Check if any TXT record matches our token
    tokenFound = allRecords.includes(expectedToken)

    IF NOT tokenFound
      RETURN { success: true, verified: false }

    // Token verified! Now add domain to Netlify
    netlifyResult = await addDomainAlias(domain)
    IF NOT netlifyResult.success
      RETURN { success: false, error: 'NETLIFY_ERROR' }

    // Mark ownership as verified
    UPDATE biolinks
    SET domainOwnershipVerified = true,
        updatedAt = new Date()
    WHERE id = biolinkId

    RETURN { success: true, verified: true }

  CATCH (error)
    // DNS lookup failed (TXT record not found)
    RETURN { success: true, verified: false }
END

// ============================================
// FUNCTION: Verify CNAME configuration
// ============================================
FUNCTION verifyCNAME(
  userId: string,
  biolinkId: string
): Promise<VerifyCNAMEResult>

  // Get domain
  biolinkResult = SELECT id, customDomain, domainOwnershipVerified
                  FROM biolinks
                  WHERE id = biolinkId AND userId = userId
  IF biolinkResult IS empty
    RETURN { success: false, error: 'BIOLINK_NOT_FOUND' }

  IF biolinkResult.customDomain IS null
    RETURN { success: false, error: 'DOMAIN_NOT_SET' }

  IF NOT biolinkResult.domainOwnershipVerified
    RETURN { success: false, error: 'OWNERSHIP_NOT_VERIFIED' }

  TRY
    // Check CNAME record
    cnameRecords = await dns.resolveCname(biolinkResult.customDomain)

    // Check if any CNAME points to Netlify
    pointsToBiolinq = cnameRecords.some(record =>
      record.replace(/\.$/, '').toLowerCase() === 'biolinq.page'
    )

    IF pointsToBiolinq
      UPDATE biolinks SET cnameVerified = true WHERE id = biolinkId
      RETURN { success: true, verified: true }
    ELSE
      RETURN { success: true, verified: false }
  CATCH (error)
    // DNS lookup failed (CNAME not configured)
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
             AND biolinks.domainOwnershipVerified = true
             AND biolinks.cnameVerified = true
           LIMIT 1

  IF result IS empty
    RETURN { success: false }

  RETURN {
    success: true,
    biolink: result.biolink,
    user: { name: result.name, image: result.image, isPremium: result.isPremium }
  }
END

EXPORT setCustomDomain, removeCustomDomain, verifyDomainOwnership, verifyCNAME, getBiolinkByCustomDomain
```

---

### 3.5 Home Route Modification

#### `app/routes/home.tsx`
**Objective:** Modify loader to detect custom domains and render public profile instead of landing page.

**Pseudocode:**
```pseudocode
// Add to existing imports
IMPORT getBiolinkByCustomDomain from ~/services/custom-domain.server
IMPORT { getPublicLinksByBiolinkId } from ~/services/biolink.server
IMPORT { PublicProfile } from ~/components/public

// Add helper function
FUNCTION isCustomDomain(host: string): boolean
  // Check if host is NOT the main biolinq domain
  mainDomains = ['biolinq.page', 'www.biolinq.page', 'localhost', '127.0.0.1']
  RETURN NOT mainDomains.some(d => host === d OR host.startsWith(d + ':'))
END

// Modify loader
FUNCTION loader({ request })
  url = new URL(request.url)
  host = url.host // e.g., 'links.usersite.com' or 'biolinq.page'

  // STEP 1: Check for custom domain
  IF isCustomDomain(host)
    customDomainResult = await getBiolinkByCustomDomain(host)
    IF customDomainResult.success
      // Custom domain found and verified - serve this profile
      links = await getPublicLinksByBiolinkId(customDomainResult.biolink.id)

      // Track view (optional - same logic as public route)
      // ... tracking code if needed ...

      RETURN data({
        renderType: 'profile',
        biolink: customDomainResult.biolink,
        user: customDomainResult.user,
        links,
        isCustomDomain: true
      })
    // If custom domain not found/verified, return 404
    THROW new Response('Not Found', { status: 404 })

  // STEP 2: Render normal landing page
  RETURN data({
    renderType: 'landing'
  })
END

// Modify component
FUNCTION Home()
  loaderData = useLoaderData<typeof loader>()

  // Conditionally render based on loader data
  IF loaderData.renderType === 'profile'
    RETURN <PublicProfile
      biolink={loaderData.biolink}
      user={loaderData.user}
      links={loaderData.links}
      isCustomDomain={loaderData.isCustomDomain}
    />

  // Default: render landing page
  RETURN (
    <>
      <Header />
      <BioLinqHero />
      <Footer />
    </>
  )
END
```

**Note:** This approach reuses the existing `PublicProfile` component, keeping code DRY.

---

### 3.6 Dashboard Route Modification

#### `app/routes/dashboard.tsx`
**Objective:** Add custom domain action handling.

**Pseudocode:**
```pseudocode
// Add to imports
IMPORT {
  setCustomDomain,
  removeCustomDomain,
  verifyDomainOwnership,
  verifyCNAME
} from ~/services/custom-domain.server

// Add to loader return
RETURN {
  ...existing data...,
  biolink: {
    ...biolink,
    customDomain: biolink.customDomain,
    domainVerificationToken: biolink.domainVerificationToken,
    domainOwnershipVerified: biolink.domainOwnershipVerified,
    cnameVerified: biolink.cnameVerified
  }
}

// Add to action function
IF intent === 'setCustomDomain'
  domain = formData.get('domain') as string
  biolinkId = formData.get('biolinkId') as string

  result = await setCustomDomain(authSession.user.id, biolinkId, domain)

  IF NOT result.success
    RETURN data({ error: result.error })

  // Return token so UI can display it
  RETURN data({ success: true, verificationToken: result.verificationToken })

IF intent === 'removeCustomDomain'
  biolinkId = formData.get('biolinkId') as string

  result = await removeCustomDomain(authSession.user.id, biolinkId)

  IF NOT result.success
    RETURN data({ error: result.error })

  RETURN redirect('/dashboard')

IF intent === 'verifyDomainOwnership'
  biolinkId = formData.get('biolinkId') as string

  result = await verifyDomainOwnership(authSession.user.id, biolinkId)

  IF NOT result.success
    RETURN data({ error: result.error })

  // Return verification status without redirect (for inline feedback)
  RETURN data({ ownershipVerified: result.verified })

IF intent === 'verifyCNAME'
  biolinkId = formData.get('biolinkId') as string

  result = await verifyCNAME(authSession.user.id, biolinkId)

  IF NOT result.success
    RETURN data({ error: result.error })

  // Return verification status without redirect (for inline feedback)
  RETURN data({ cnameVerified: result.verified })
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
    domainVerificationToken: string | null
    domainOwnershipVerified: boolean
    cnameVerified: boolean
    isPremium: boolean

  STATE:
    domainInput: string (initialized to customDomain or '')
    isVerifyingOwnership: boolean = false
    isVerifyingCNAME: boolean = false

  HOOKS:
    { t } = useTranslation()
    fetcher = useFetcher()

  // Handle verification check
  EFFECT: when fetcher.data changes
    IF fetcher.data?.ownershipVerified !== undefined
      setIsVerifyingOwnership(false)
    IF fetcher.data?.cnameVerified !== undefined
      setIsVerifyingCNAME(false)

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

              // Phase 1: Ownership verification
              IF NOT domainOwnershipVerified
                <Badge variant="warning">{t('custom_domain_ownership_pending')}</Badge>
              ELSE IF NOT cnameVerified
                <Badge variant="warning">{t('custom_domain_cname_pending')}</Badge>
              ELSE
                <Badge variant="success">{t('custom_domain_verified')}</Badge>
            </div>

            // PHASE 1: TXT Record Challenge
            IF NOT domainOwnershipVerified
              <Alert>
                <AlertTitle>{t('custom_domain_ownership_title')}</AlertTitle>
                <AlertDescription>
                  <p>{t('custom_domain_ownership_instruction')}</p>
                  <code className="block mt-2 p-2 bg-muted rounded">
                    TXT _biolinq-verify.{customDomain} → {domainVerificationToken}
                  </code>
                </AlertDescription>
              </Alert>

              <fetcher.Form method="post">
                <input type="hidden" name="intent" value="verifyDomainOwnership" />
                <input type="hidden" name="biolinkId" value={biolinkId} />
                <Button
                  type="submit"
                  variant="outline"
                  disabled={fetcher.state !== 'idle'}
                >
                  {fetcher.state !== 'idle' ? t('custom_domain_verifying') : t('custom_domain_verify_ownership')}
                </Button>
              </fetcher.Form>

            // PHASE 2: CNAME Configuration (only show after ownership verified)
            ELSE IF domainOwnershipVerified AND NOT cnameVerified
              <Alert variant="success">
                <AlertTitle>{t('custom_domain_ownership_verified_title')}</AlertTitle>
                <AlertDescription>
                  <p>{t('custom_domain_cname_instruction')}</p>
                  <code className="block mt-2 p-2 bg-muted rounded">
                    CNAME {customDomain} → biolinq.page
                  </code>
                </AlertDescription>
              </Alert>

              <fetcher.Form method="post">
                <input type="hidden" name="intent" value="verifyCNAME" />
                <input type="hidden" name="biolinkId" value={biolinkId} />
                <Button
                  type="submit"
                  variant="outline"
                  disabled={fetcher.state !== 'idle'}
                >
                  {fetcher.state !== 'idle' ? t('custom_domain_verifying') : t('custom_domain_verify_cname')}
                </Button>
              </fetcher.Form>

            // PHASE 3: Fully verified
            ELSE IF domainOwnershipVerified AND cnameVerified
              <Alert variant="success">
                <AlertTitle>{t('custom_domain_live_title')}</AlertTitle>
                <AlertDescription>
                  {t('custom_domain_live_message')}
                </AlertDescription>
              </Alert>

            // Remove button (available at any stage)
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
  domainVerificationToken={biolink.domainVerificationToken}
  domainOwnershipVerified={biolink.domainOwnershipVerified}
  cnameVerified={biolink.cnameVerified}
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
| `custom_domain_verified` | Live | En producción |
| `custom_domain_ownership_pending` | Pending ownership verification | Pendiente de verificar propiedad |
| `custom_domain_cname_pending` | Pending CNAME configuration | Pendiente de configurar CNAME |
| `custom_domain_ownership_title` | Step 1: Verify Domain Ownership | Paso 1: Verificar Propiedad del Dominio |
| `custom_domain_ownership_instruction` | Add this TXT record to your DNS provider to prove ownership: | Agrega este registro TXT a tu proveedor DNS para probar propiedad: |
| `custom_domain_verify_ownership` | Verify Ownership | Verificar Propiedad |
| `custom_domain_ownership_verified_title` | Step 2: Configure CNAME | Paso 2: Configurar CNAME |
| `custom_domain_cname_instruction` | Add this CNAME record to route traffic to your BioLinq page: | Agrega este registro CNAME para dirigir el trafico a tu pagina BioLinq: |
| `custom_domain_verify_cname` | Check CNAME | Verificar CNAME |
| `custom_domain_live_title` | Domain is Live! | ¡Dominio en Producción! |
| `custom_domain_live_message` | Your custom domain is fully configured and serving traffic | Tu dominio personalizado esta completamente configurado y sirviendo trafico |
| `custom_domain_verifying` | Checking... | Verificando... |
| `custom_domain_remove` | Remove Domain | Eliminar Dominio |
| `custom_domain_error_PREMIUM_REQUIRED` | Custom domains require Premium | Los dominios personalizados requieren Premium |
| `custom_domain_error_INVALID_DOMAIN_FORMAT` | Invalid domain format | Formato de dominio invalido |
| `custom_domain_error_DOMAIN_ALREADY_TAKEN` | This domain is already in use | Este dominio ya esta en uso |
| `custom_domain_error_NETLIFY_ERROR` | Could not configure domain. Please try again. | No se pudo configurar el dominio. Intenta de nuevo. |
| `custom_domain_error_DOMAIN_NOT_SET` | No custom domain is configured | No hay dominio personalizado configurado |
| `custom_domain_error_OWNERSHIP_NOT_VERIFIED` | You must verify domain ownership first | Debes verificar la propiedad del dominio primero |
| `custom_domain_error_TXT_RECORD_NOT_FOUND` | TXT record not found | Registro TXT no encontrado |
| `custom_domain_error_TXT_RECORD_MISMATCH` | TXT record does not match | El registro TXT no coincide |

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
  - TXT record instructions appear with verification token
  - "Pending ownership verification" badge shows
  - Netlify API is NOT called yet

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

### Test: Domain ownership verification flow
- **Preconditions:** Premium user logged in, domain added but ownership not verified
- **Steps:**
  1. Mock DNS TXT record: `_biolinq-verify.test.example.com` → `{correct_token}`
  2. Click "Verify Ownership"
- **Expected:**
  - DNS lookup performed
  - Token matches
  - Netlify API called to add domain alias
  - `domainOwnershipVerified = true` in DB
  - UI shows "Step 2: Configure CNAME"

### Test: Domain ownership fails with wrong TXT record
- **Preconditions:** Premium user logged in, domain added
- **Steps:**
  1. Mock DNS TXT record with WRONG token
  2. Click "Verify Ownership"
- **Expected:**
  - DNS lookup performed
  - Verification fails
  - `domainOwnershipVerified = false` in DB
  - UI still shows TXT instructions

### Test: CNAME verification flow
- **Preconditions:** Premium user logged in, ownership verified but CNAME not verified
- **Steps:**
  1. Mock DNS CNAME record: `test.example.com` → `biolinq.page`
  2. Click "Check CNAME"
- **Expected:**
  - DNS lookup performed
  - CNAME verified
  - `cnameVerified = true` in DB
  - UI shows "Domain is Live!"

### Test: User can remove custom domain
- **Preconditions:** Premium user logged in, has custom domain set (ownership verified)
- **Steps:**
  1. Navigate to `/dashboard`
  2. Click "Remove Domain"
- **Expected:**
  - Domain removed from Netlify (API called)
  - All domain fields cleared in DB
  - Input form appears again

### Test: Fully verified custom domain resolves to user profile
- **Preconditions:**
  - Premium user has `links.testuser.com` with both ownership + CNAME verified
  - DNS properly configured (mock in test)
- **Steps:**
  1. Make request to app with `Host: links.testuser.com`
- **Expected:**
  - User's public profile renders
  - Correct biolink data displayed

### Test: Domain with only ownership verified returns 404
- **Preconditions:**
  - Premium user has `links.testuser.com` with ownership verified but CNAME not verified
- **Steps:**
  1. Make request to app with `Host: links.testuser.com`
- **Expected:** 404 Not Found (both flags required)

### Test: Unverified custom domain returns 404
- **Preconditions:**
  - Premium user has `links.testuser.com` set but ownership NOT verified
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

### Why Two-Phase Verification?

The original plan had a simpler flow: add domain → call Netlify → verify CNAME. However, this approach has serious problems:

**Problems with single-phase verification:**
1. **Domain squatting:** Anyone could claim any domain (e.g., `google.com`) without proving ownership
2. **Netlify resource exhaustion:** Netlify limits domain aliases per site; unverified claims waste slots
3. **Security risk:** Malicious users could disrupt legitimate domain owners

**Benefits of two-phase verification:**
1. **Proof of ownership required first:** TXT record challenge ensures only domain owners can claim a domain
2. **Netlify aliases only for verified domains:** Only call Netlify API after ownership is proven
3. **Clear user journey:** Users understand they need to prove ownership first, then configure routing
4. **Industry standard:** This is how major platforms (Vercel, Cloudflare Pages, GitHub Pages) handle custom domains

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
  // Note: User configures CNAME to point to biolinq.page (not netlify subdomain)
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
