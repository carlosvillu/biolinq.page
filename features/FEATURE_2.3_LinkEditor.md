# FEATURE_2.3_LinkEditor.md

## ✅ IMPLEMENTATION STATUS: 100% COMPLETE

**Verificado en producción: Sin fallos ✅**

---

## 1. Natural Language Description

### Estado Actual

El dashboard muestra un placeholder (`LinksEditorPlaceholder.tsx`) con el mensaje "Links editor coming in Task 2.3...". El servicio de links (`links.server.ts`) ya tiene las funciones `createLink`, `deleteLink`, `getLinksByBiolinkId`, y `reorderLinks` implementadas. El loader del dashboard ya carga los links del usuario.

### Estado Esperado

El usuario puede:

1. Ver la lista de sus links actuales (0-5)
2. Hacer click en "Añadir Link" que abre un modal/dialog para crear un nuevo link
3. En el modal: ingresar emoji (picker nativo OS), título y URL
4. Guardar el link (con spinner mientras procesa)
5. Borrar un link existente con confirmación (AlertDialog)

**Fuera de alcance:**

- La vista previa del teléfono (PhonePreview) NO se modifica en esta tarea

**Restricciones explícitas del usuario:**

- NO autosave - solo botón Save explícito
- NO edición de links existentes - el usuario debe borrar y recrear
- NO drag & drop para reordenar (se implementa en Task 2.4)
- NO UI optimista - usar spinners cuando algo puede tardar
- Usar picker de emoji nativo del OS

---

## 2. Technical Description

### Arquitectura

- **Route module** (`dashboard.tsx`): Añadir action para manejar create/delete de links. El componente solo compone los componentes existentes.
- **Componente `LinkItem`**: Muestra un link individual con emoji, título, URL y botón de borrar. Sin inputs editables (solo visualización).
- **Componente `LinksList`**: Lista de `LinkItem` + contador + botón "Añadir Link".
- **Componente `AddLinkDialog`**: Modal Base UI con formulario para crear link (emoji, título, URL).
- **Componente `DeleteLinkDialog`**: AlertDialog Base UI para confirmar borrado.

### Flujo de Datos

1. Links se cargan en el loader (ya implementado)
2. "Añadir Link" abre `AddLinkDialog` → usuario completa form → submit POST a action → redirect recarga datos
3. "Borrar" abre `DeleteLinkDialog` → confirma → submit DELETE a action → redirect recarga datos

### Dependencias

- `@base-ui/react/dialog` para el modal de añadir
- `@base-ui/react/alert-dialog` para confirmación de borrado
- Zod para validación del formulario (reutilizar `createLinkSchema`)

---

## 2.1. Architecture Gate

- **Pages are puzzles:** `dashboard.tsx` solo compone `StatsCard`, `LinksList`, `PhonePreview`, etc. No tiene lógica de negocio.
- **Loaders/actions are thin:**
  - Loader: ya implementado, llama a `getLinksByBiolinkId`
  - Action: parsea intent (create/delete), llama al servicio correspondiente, redirect
- **Business logic is not in components:**
  - Toda lógica de DB está en `app/services/links.server.ts`
  - Los componentes solo renderizan y manejan estado UI local (open/close dialogs)

### Componentes y su rol:

- `LinksList`: Renderiza lista + botón añadir. Usa estado local para controlar `AddLinkDialog` open/close.
- `LinkItem`: Puro visual. Recibe props, no tiene lógica de negocio.
- `AddLinkDialog`: Formulario con validación Zod. Submit hace POST form action.
- `DeleteLinkDialog`: Confirmación. Confirmar hace POST form action con intent=delete.

---

## 3. Files to Change/Create

### `app/routes/dashboard.tsx`

**Objective:** Añadir action para manejar create/delete de links. Reemplazar `LinksEditorPlaceholder` por `LinksList`.

**Pseudocode:**

```pseudocode
// Action (nuevo)
FUNCTION action(request)
  session = await getCurrentUser(request)
  IF NOT session THEN redirect('/auth/login')

  formData = await request.formData()
  intent = formData.get('intent')

  IF intent == 'create' THEN
    emoji = formData.get('emoji') OR null
    title = formData.get('title')
    url = formData.get('url')
    biolinkId = formData.get('biolinkId')

    result = await createLink(session.user.id, biolinkId, { emoji, title, url })

    IF NOT result.success THEN
      RETURN json({ error: result.error })
    END

    RETURN redirect('/dashboard')
  END

  IF intent == 'delete' THEN
    linkId = formData.get('linkId')

    result = await deleteLink(session.user.id, linkId)

    IF NOT result.success THEN
      RETURN json({ error: result.error })
    END

    RETURN redirect('/dashboard')
  END

  RETURN json({ error: 'UNKNOWN_INTENT' })
END

// Component (modificar)
COMPONENT DashboardPage
  data = useLoaderData() // { user, biolink, links }
  actionData = useActionData() // para mostrar errores

  RENDER:
    <div>
      IF NOT user.isPremium THEN <PremiumBanner />

      <main grid layout>
        <div left column>
          <StatsCard />
          <LinksList
            links={links}
            biolinkId={biolink.id}
            maxLinks={5}
            error={actionData?.error}
          />
        </div>

        <PhonePreview />
      </main>
    </div>
END
```

---

### `app/components/dashboard/LinksList.tsx`

**Objective:** Contenedor de la lista de links con contador y botón añadir.

**Pseudocode:**

```pseudocode
COMPONENT LinksList
  PROPS: links[], biolinkId, maxLinks, error?

  STATE: addDialogOpen = false

  canAddMore = links.length < maxLinks

  RENDER:
    <NeoBrutalCard variant="panel">
      <header flex justify-between>
        <h2>{t('dashboard_my_links')} ({links.length}/{maxLinks})</h2>
      </header>

      IF error THEN
        <ErrorMessage error={error} />
      END

      <div space-y-4>
        FOR EACH link IN links
          <LinkItem key={link.id} link={link} />
        END

        IF links.length == 0 THEN
          <EmptyState message={t('dashboard_no_links')} />
        END
      </div>

      <NeoBrutalButton
        onClick={() => setAddDialogOpen(true)}
        disabled={!canAddMore}
      >
        + {t('dashboard_add_link')}
      </NeoBrutalButton>

      <AddLinkDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        biolinkId={biolinkId}
      />
    </NeoBrutalCard>
END
```

---

### `app/components/dashboard/LinkItem.tsx`

**Objective:** Mostrar un link individual con botón de borrar.

**Pseudocode:**

```pseudocode
COMPONENT LinkItem
  PROPS: link { id, emoji, title, url }

  STATE: deleteDialogOpen = false

  // Extraer dominio de la URL para mostrar
  displayUrl = new URL(link.url).hostname

  RENDER:
    // Neo-brutal card style from mockup
    <div class="relative group">
      // Shadow layer
      <div class="absolute inset-0 bg-white border-[3px] border-neo-dark rounded translate-y-1 translate-x-1" />

      // Card content
      <div class="relative bg-white border-[3px] border-neo-dark rounded p-3 flex gap-3 items-center">
        // Emoji display (click to show picker hint)
        <div class="w-10 h-10 bg-neo-input border-2 border-neo-dark rounded flex items-center justify-center text-xl">
          {link.emoji OR '🔗'}
        </div>

        // Link info
        <div class="flex-1 min-w-0">
          <p class="font-bold truncate">{link.title}</p>
          <p class="text-xs font-mono text-gray-500 truncate">{displayUrl}</p>
        </div>

        // Delete button
        <button
          onClick={() => setDeleteDialogOpen(true)}
          class="text-gray-400 hover:text-neo-accent p-2"
          aria-label={t('dashboard_delete_link')}
        >
          <TrashIcon />
        </button>
      </div>
    </div>

    <DeleteLinkDialog
      open={deleteDialogOpen}
      onOpenChange={setDeleteDialogOpen}
      linkId={link.id}
      linkTitle={link.title}
    />
END
```

---

### `app/components/dashboard/AddLinkDialog.tsx`

**Objective:** Modal para crear un nuevo link con emoji, título y URL.

**Pseudocode:**

```pseudocode
COMPONENT AddLinkDialog
  PROPS: open, onOpenChange, biolinkId

  navigation = useNavigation()
  isSubmitting = navigation.state === 'submitting' AND navigation.formData?.get('intent') === 'create'

  // Cerrar dialog cuando submission completa
  EFFECT:
    IF was submitting AND now idle THEN
      onOpenChange(false)
    END

  RENDER:
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop class="fixed inset-0 bg-black/50" />

        <Dialog.Popup class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-full max-w-md bg-white border-[3px] border-neo-dark rounded-xl p-6 shadow-hard-lg">

          <Dialog.Title class="text-xl font-bold mb-4">
            {t('dashboard_add_link_title')}
          </Dialog.Title>

          <Form method="post" class="space-y-4">
            <input type="hidden" name="intent" value="create" />
            <input type="hidden" name="biolinkId" value={biolinkId} />

            // Emoji field - simple text input for native picker
            <div>
              <label class="block font-medium mb-1">{t('dashboard_link_emoji_label')}</label>
              <input
                type="text"
                name="emoji"
                placeholder="🔗"
                maxLength={2}
                class="w-16 text-center text-2xl p-2 bg-neo-input border-[3px] border-neo-dark rounded"
              />
              <p class="text-xs text-gray-500 mt-1">{t('dashboard_emoji_hint')}</p>
            </div>

            // Title field
            <div>
              <label class="block font-medium mb-1">{t('dashboard_link_title_label')} *</label>
              <NeoBrutalInput
                name="title"
                required
                maxLength={50}
                placeholder={t('dashboard_link_title_placeholder')}
              />
            </div>

            // URL field
            <div>
              <label class="block font-medium mb-1">{t('dashboard_link_url_label')} *</label>
              <NeoBrutalInput
                name="url"
                type="url"
                required
                placeholder="https://example.com"
              />
            </div>

            // Actions
            <div class="flex gap-3 justify-end pt-4">
              <Dialog.Close asChild>
                <NeoBrutalButton type="button" variant="secondary">
                  {t('cancel')}
                </NeoBrutalButton>
              </Dialog.Close>

              <NeoBrutalButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Spinner /> : null}
                {t('dashboard_save_link')}
              </NeoBrutalButton>
            </div>
          </Form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
END
```

---

### `app/components/dashboard/DeleteLinkDialog.tsx`

**Objective:** AlertDialog para confirmar borrado de un link.

**Pseudocode:**

```pseudocode
COMPONENT DeleteLinkDialog
  PROPS: open, onOpenChange, linkId, linkTitle

  navigation = useNavigation()
  isDeleting = navigation.state === 'submitting' AND navigation.formData?.get('intent') === 'delete'

  RENDER:
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop class="fixed inset-0 bg-black/50" />

        <AlertDialog.Popup class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-full max-w-sm bg-white border-[3px] border-neo-dark rounded-xl p-6 shadow-hard-lg">

          <AlertDialog.Title class="text-xl font-bold mb-2">
            {t('dashboard_delete_link_title')}
          </AlertDialog.Title>

          <AlertDialog.Description class="text-gray-600 mb-6">
            {t('dashboard_delete_link_confirm', { title: linkTitle })}
          </AlertDialog.Description>

          <Form method="post">
            <input type="hidden" name="intent" value="delete" />
            <input type="hidden" name="linkId" value={linkId} />

            <div class="flex gap-3 justify-end">
              <AlertDialog.Close asChild>
                <NeoBrutalButton type="button" variant="secondary">
                  {t('cancel')}
                </NeoBrutalButton>
              </AlertDialog.Close>

              <NeoBrutalButton type="submit" variant="accent" disabled={isDeleting}>
                {isDeleting ? <Spinner /> : null}
                {t('dashboard_delete_link_button')}
              </NeoBrutalButton>
            </div>
          </Form>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
END
```

---

### `app/components/dashboard/index.ts`

**Objective:** Actualizar exports para incluir nuevos componentes.

**Pseudocode:**

```pseudocode
// Añadir exports:
export { LinksList } from './LinksList'
export { LinkItem } from './LinkItem'
export { AddLinkDialog } from './AddLinkDialog'
export { DeleteLinkDialog } from './DeleteLinkDialog'

// Remover (ya no se usa):
// export { LinksEditorPlaceholder } from './LinksEditorPlaceholder'
```

---

### `app/components/dashboard/LinksEditorPlaceholder.tsx`

**Objective:** ELIMINAR este archivo (ya no se necesita).

---

## 4. I18N

### Existing keys to reuse

- `dashboard_my_links` - Para el título de la sección
- `cancel` - Necesita crearse (botón cancelar genérico)

### New keys to create

| Key                                | English                                    | Spanish                                      |
| ---------------------------------- | ------------------------------------------ | -------------------------------------------- |
| `dashboard_add_link`               | Add Link                                   | Añadir Link                                  |
| `dashboard_add_link_title`         | Add new link                               | Añadir nuevo link                            |
| `dashboard_link_emoji_label`       | Emoji                                      | Emoji                                        |
| `dashboard_emoji_hint`             | Press Ctrl+. (Win) or Cmd+Ctrl+Space (Mac) | Presiona Ctrl+. (Win) o Cmd+Ctrl+Space (Mac) |
| `dashboard_link_title_label`       | Title                                      | Título                                       |
| `dashboard_link_title_placeholder` | My Website                                 | Mi Sitio Web                                 |
| `dashboard_link_url_label`         | URL                                        | URL                                          |
| `dashboard_save_link`              | Save                                       | Guardar                                      |
| `dashboard_delete_link`            | Delete link                                | Eliminar link                                |
| `dashboard_delete_link_title`      | Delete link?                               | ¿Eliminar link?                              |
| `dashboard_delete_link_confirm`    | "{{title}}" will be permanently deleted.   | "{{title}}" se eliminará permanentemente.    |
| `dashboard_delete_link_button`     | Delete                                     | Eliminar                                     |
| `dashboard_no_links`               | No links yet. Add your first one!          | Sin links todavía. ¡Añade el primero!        |
| `cancel`                           | Cancel                                     | Cancelar                                     |
| `dashboard_link_error_max_reached` | Maximum links reached (5)                  | Máximo de links alcanzado (5)                |
| `dashboard_link_error_invalid_url` | Please enter a valid URL                   | Por favor ingresa una URL válida             |

---

## 5. E2E Test Plan

### Test: User can add a new link

- **Preconditions:** User is logged in with a biolink, has 0 links
- **Steps:**
  1. Navigate to `/dashboard`
  2. Click "Añadir Link" button
  3. Enter emoji: "🐦"
  4. Enter title: "Twitter"
  5. Enter URL: "https://twitter.com/myuser"
  6. Click "Guardar"
- **Expected:**
  - Dialog closes
  - Link appears in the list with emoji, title, and URL domain
  - Counter shows "(1/5)"

### Test: User can delete a link

- **Preconditions:** User is logged in with a biolink, has 1 link
- **Steps:**
  1. Navigate to `/dashboard`
  2. Click trash icon on the link
  3. Confirm deletion in the dialog
- **Expected:**
  - Confirmation dialog appears with link title
  - After confirming, link disappears from list
  - Counter shows "(0/5)"

### Test: User cannot add more than 5 links

- **Preconditions:** User is logged in with a biolink, has 5 links
- **Steps:**
  1. Navigate to `/dashboard`
- **Expected:**
  - "Añadir Link" button is disabled
  - Counter shows "(5/5)"

### Test: Cancel adding a link

- **Preconditions:** User is logged in with a biolink
- **Steps:**
  1. Navigate to `/dashboard`
  2. Click "Añadir Link" button
  3. Enter some data
  4. Click "Cancelar"
- **Expected:**
  - Dialog closes
  - No link is added
  - Link count unchanged

### Test: Cancel deleting a link

- **Preconditions:** User is logged in with a biolink, has 1 link
- **Steps:**
  1. Navigate to `/dashboard`
  2. Click trash icon on the link
  3. Click "Cancelar" in confirmation dialog
- **Expected:**
  - Dialog closes
  - Link still exists in the list

### Test: URL validation shows error for invalid URL

- **Preconditions:** User is logged in with a biolink
- **Steps:**
  1. Navigate to `/dashboard`
  2. Click "Añadir Link"
  3. Enter title: "Test"
  4. Enter URL: "not-a-url"
  5. Click "Guardar"
- **Expected:**
  - Form shows validation error
  - Link is not created

---

## Implementation Notes

1. **Base UI imports:** Usar imports específicos para tree-shaking:

   ```typescript
   import { Dialog } from '@base-ui/react/dialog'
   import { AlertDialog } from '@base-ui/react/alert-dialog'
   ```

2. **Form validation:** El action debe validar con Zod y devolver errores traducidos si falla.

3. **Spinners:** Crear un pequeño componente Spinner o usar un icono animado para estados de carga.

4. **Error handling:** Los errores del servicio (`MAX_LINKS_REACHED`, `NOT_OWNER`, etc.) deben mapearse a claves i18n.
