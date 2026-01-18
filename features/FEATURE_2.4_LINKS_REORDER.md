# FEATURE_2.4_LINKS_REORDER.md

## 1. Natural Language Description

### Current State

El dashboard (`/dashboard`) permite crear y eliminar links mediante diálogos modales. Los componentes `LinksList.tsx` y `LinkItem.tsx` ya existen y muestran la lista de links del usuario con contador (3/5) y botón "Add Link" que se deshabilita al alcanzar el máximo.

Sin embargo:
- **No hay funcionalidad de reordenamiento** - Los links se muestran en orden fijo
- **No hay drag handle** en los items de la lista
- **No hay feedback visual** durante el arrastre
- El servicio `reorderLinks()` ya existe en `links.server.ts` pero no se usa

### Expected End State

El usuario podrá **reordenar links arrastrándolos** (drag & drop) con las siguientes características:

1. **Drag handle dedicado** - Un icono de 6 puntos (⠿) a la izquierda de cada link item
2. **DragOverlay flotante** - Al arrastrar, una copia visual del link sigue el cursor mientras el original queda "fantasma"
3. **Botón "Guardar orden"** - Aparece en el header de LinksList solo cuando hay cambios de orden pendientes
4. **Error inline** - Si falla el guardado, se muestra un mensaje de error con el patrón existente (div rojo) y el orden visual se revierte al original
5. **No auto-save** - El usuario debe hacer clic en el botón para persistir los cambios

---

## 2. Technical Description

### High-Level Approach

- **@dnd-kit** como librería de drag & drop (React, accesible, performante)
- **Optimistic UI** - El orden visual cambia inmediatamente durante el arrastre
- **Estado local** para el orden pendiente vs. el orden guardado (para poder revertir)
- **Form action** con `intent: 'reorder'` para persistir el nuevo orden

### Architecture Decisions

- **@dnd-kit/core + @dnd-kit/sortable** - Provee todo lo necesario para listas ordenables
- **Estado local en LinksList** - Mantiene `orderedLinks` (visual) vs `links` (props del servidor)
- **Comparación de IDs** para detectar si hay cambios pendientes
- **SortableItem wrapper** para cada LinkItem
- **DragOverlay** para el feedback visual durante el arrastre

### Dependencies

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## 2.1. Architecture Gate

- **Pages are puzzles:** La ruta `dashboard.tsx` no cambia su estructura, solo añade un nuevo intent `'reorder'` en el action.
- **Loaders/actions are thin:** El action para reorder solo parsea el `request`, valida los IDs, llama a `reorderLinks()` y retorna/redirige.
- **Business logic is not in components:**
  - Domain logic: `reorderLinks()` ya existe en `app/services/links.server.ts`
  - UI orchestration: El estado de drag & drop se maneja en `LinksList.tsx` con hooks de @dnd-kit
  - Components: `LinkItem` recibe props para drag handle, `SortableLinkItem` es un wrapper

### Route Module Breakdown

**`app/routes/dashboard.tsx`**
- **Loader**: Sin cambios
- **Action**: Añade handler para `intent: 'reorder'` que llama a `reorderLinks()`
- **Component**: Sin cambios (delega a `LinksList`)

### Component Breakdown

| Component | Hooks Used | Business Logic |
|-----------|------------|----------------|
| `LinksList` | `useSensors`, `useSensor`, state local para orden | NINGUNA - solo orchestration de UI |
| `SortableLinkItem` | `useSortable` de @dnd-kit | NINGUNA - wrapper para sortable |
| `LinkItem` | ninguno | NINGUNA - recibe `dragHandleProps` como prop |
| `DragHandle` | ninguno | NINGUNA - visual puro |

---

## 3. Files to Change/Create

### `app/routes/dashboard.tsx`

**Objective:** Añadir handler para el intent `'reorder'` en el action.

**Pseudocode:**

```pseudocode
// ACTION (añadir al existente)
IF intent === 'reorder' THEN
  linkIds = JSON.parse(formData.get('linkIds'))
  biolinkId = formData.get('biolinkId')

  result = reorderLinks(authSession.user.id, biolinkId, linkIds)

  IF NOT result.success THEN
    RETURN data({ error: result.error })

  RETURN redirect('/dashboard')
END
```

**Import adicional:**
```typescript
import { reorderLinks } from '~/services/links.server'
```

---

### `app/components/dashboard/LinksList.tsx`

**Objective:** Implementar drag & drop con @dnd-kit, estado local para orden, y botón "Guardar orden".

**Pseudocode:**

```pseudocode
COMPONENT LinksList(props: { links, biolinkId, maxLinks, error })
  // Estado local para el orden visual (puede diferir del servidor)
  [orderedLinks, setOrderedLinks] = useState(props.links)
  [isSaving, setIsSaving] = useState(false)
  [reorderError, setReorderError] = useState<string | null>(null)

  // Referencia al orden original del servidor
  originalOrder = useMemo(() => props.links.map(l => l.id), [props.links])

  // Sincronizar cuando props.links cambie (después de guardar exitoso)
  useEffect(() => {
    setOrderedLinks(props.links)
    setReorderError(null)
  }, [props.links])

  // Detectar si hay cambios pendientes
  hasChanges = useMemo(() => {
    currentOrder = orderedLinks.map(l => l.id)
    RETURN JSON.stringify(currentOrder) !== JSON.stringify(originalOrder)
  }, [orderedLinks, originalOrder])

  // Configuración de sensores dnd-kit (pointer + keyboard)
  sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Estado para el item activo (para DragOverlay)
  [activeId, setActiveId] = useState<string | null>(null)
  activeLink = orderedLinks.find(l => l.id === activeId)

  // Handlers de drag
  FUNCTION handleDragStart(event)
    setActiveId(event.active.id)
  END

  FUNCTION handleDragEnd(event)
    setActiveId(null)
    IF event.active.id !== event.over?.id THEN
      setOrderedLinks(prev => {
        oldIndex = prev.findIndex(l => l.id === event.active.id)
        newIndex = prev.findIndex(l => l.id === event.over.id)
        RETURN arrayMove(prev, oldIndex, newIndex)
      })
    END
  END

  // Submit del form para reordenar
  submit = useSubmit()
  FUNCTION handleSaveOrder()
    setIsSaving(true)
    setReorderError(null)

    formData = new FormData()
    formData.set('intent', 'reorder')
    formData.set('biolinkId', biolinkId)
    formData.set('linkIds', JSON.stringify(orderedLinks.map(l => l.id)))

    submit(formData, { method: 'post' })
  END

  // Detectar errores de la action
  actionData = useActionData()
  useEffect(() => {
    IF actionData?.error AND isSaving THEN
      setReorderError(actionData.error)
      setOrderedLinks(props.links) // Revertir al orden original
      setIsSaving(false)
    END
  }, [actionData])

  // Detectar navegación completada (guardado exitoso)
  navigation = useNavigation()
  useEffect(() => {
    IF navigation.state === 'idle' AND isSaving THEN
      setIsSaving(false)
    END
  }, [navigation.state])

  RENDER:
    <NeoBrutalCard variant="panel">
      <header className="flex justify-between items-center mb-4">
        <h2>{t('dashboard_my_links')} ({orderedLinks.length}/{maxLinks})</h2>

        <!-- Botón "Guardar orden" solo si hay cambios -->
        IF hasChanges THEN
          <NeoBrutalButton
            variant="primary"
            size="sm"
            onClick={handleSaveOrder}
            disabled={isSaving}
          >
            {isSaving ? t('saving') : t('dashboard_save_order')}
          </NeoBrutalButton>
      </header>

      <!-- Mostrar error de props O error de reorder -->
      IF props.error OR reorderError THEN
        <div className="mb-4 p-3 bg-red-100 border-2 border-red-400 rounded text-red-700 text-sm">
          {props.error || t(`link_error_${reorderError}`)}
        </div>

      <!-- DndContext envuelve la lista -->
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orderedLinks.map(l => l.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            IF orderedLinks.length === 0 THEN
              <div className="text-center py-8 text-gray-500">
                {t('dashboard_no_links')}
              </div>
            ELSE
              FOR EACH link IN orderedLinks
                <SortableLinkItem key={link.id} link={link} />
          </div>
        </SortableContext>

        <!-- DragOverlay para feedback visual -->
        <DragOverlay>
          IF activeLink THEN
            <LinkItemOverlay link={activeLink} />
        </DragOverlay>
      </DndContext>

      <div className="mt-6">
        <NeoBrutalButton ... /> <!-- Botón Add Link sin cambios -->
      </div>
    </NeoBrutalCard>
END
```

---

### `app/components/dashboard/SortableLinkItem.tsx` (NUEVO)

**Objective:** Wrapper que aplica useSortable a LinkItem.

**Pseudocode:**

```pseudocode
INTERFACE SortableLinkItemProps
  link: Link

COMPONENT SortableLinkItem(props)
  {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: props.link.id })

  style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  RENDER:
    <div ref={setNodeRef} style={style}>
      <LinkItem
        link={props.link}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
END
```

---

### `app/components/dashboard/LinkItem.tsx`

**Objective:** Añadir drag handle a la izquierda del item.

**Pseudocode:**

```pseudocode
INTERFACE LinkItemProps
  link: Link
  dragHandleProps?: Record<string, any>  // NUEVO

COMPONENT LinkItem(props)
  // ... código existente sin cambios ...

  RENDER:
    <>
      <div className="relative group">
        <!-- Shadow layer (sin cambios) -->

        <!-- Card content -->
        <div className="relative bg-white border-[3px] border-neo-dark rounded p-3 flex gap-3 items-center">

          <!-- NUEVO: Drag Handle -->
          IF props.dragHandleProps THEN
            <button
              type="button"
              className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-neo-dark touch-none"
              {...props.dragHandleProps}
              aria-label={t('dashboard_drag_link')}
            >
              <DragHandleIcon className="w-5 h-5" />
            </button>

          <!-- Emoji display (sin cambios) -->
          <!-- Link info (sin cambios) -->
          <!-- Delete button (sin cambios) -->
        </div>
      </div>

      <DeleteLinkDialog ... />
    </>
END

// Icono de drag handle (6 puntos)
COMPONENT DragHandleIcon(props)
  RENDER:
    <svg {...props} viewBox="0 0 20 20" fill="currentColor">
      <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
    </svg>
END
```

---

### `app/components/dashboard/LinkItemOverlay.tsx` (NUEVO)

**Objective:** Versión visual del LinkItem para el DragOverlay (sin funcionalidad interactiva).

**Pseudocode:**

```pseudocode
INTERFACE LinkItemOverlayProps
  link: Link

COMPONENT LinkItemOverlay(props)
  // Extraer dominio de URL
  displayUrl = extractDomain(props.link.url)

  RENDER:
    <div className="relative">
      <!-- Shadow layer -->
      <div className="absolute inset-0 bg-neo-dark rounded translate-y-1 translate-x-1" />

      <!-- Card content (versión simplificada, sin botones) -->
      <div className="relative bg-white border-[3px] border-neo-dark rounded p-3 flex gap-3 items-center min-w-[300px]">
        <!-- Drag Handle (visual) -->
        <div className="p-1 text-neo-dark">
          <DragHandleIcon className="w-5 h-5" />
        </div>

        <!-- Emoji -->
        <div className="w-10 h-10 bg-neo-input border-2 border-neo-dark rounded flex items-center justify-center text-xl flex-shrink-0">
          {props.link.emoji || '🔗'}
        </div>

        <!-- Info -->
        <div className="flex-1 min-w-0">
          <p className="font-bold truncate">{props.link.title}</p>
          <p className="text-xs font-mono text-gray-500 truncate">{displayUrl}</p>
        </div>
      </div>
    </div>
END
```

---

### `app/components/dashboard/index.ts`

**Objective:** Exportar nuevos componentes.

**Pseudocode:**

```pseudocode
// Añadir a las exportaciones existentes:
EXPORT SortableLinkItem from './SortableLinkItem'
EXPORT LinkItemOverlay from './LinkItemOverlay'
```

---

## 4. I18N

### Existing keys to reuse

- `dashboard_my_links` - Para el título de la sección
- `dashboard_add_link` - Para el botón de añadir
- `dashboard_delete_link` - Para el aria-label del botón eliminar
- `dashboard_no_links` - Mensaje cuando no hay links
- `saving` - Si existe, para el estado de guardado

### New keys to create

| Key | English | Spanish |
|-----|---------|---------|
| `dashboard_save_order` | Save order | Guardar orden |
| `dashboard_drag_link` | Drag to reorder | Arrastrar para reordenar |
| `link_error_INVALID_LINK_IDS` | Could not save order. Please refresh and try again. | No se pudo guardar el orden. Actualiza la página e intenta de nuevo. |
| `link_error_NOT_OWNER` | You don't have permission to modify these links. | No tienes permiso para modificar estos links. |

---

## 5. E2E Test Plan

### Test: User can reorder links via drag and drop

- **Preconditions:**
  - User authenticated with biolink
  - User has 3 links: "Link A" (pos 0), "Link B" (pos 1), "Link C" (pos 2)
- **Steps:**
  1. Navigate to `/dashboard`
  2. Verify order: A, B, C
  3. Drag "Link C" to the first position
  4. Verify visual order changes: C, A, B
  5. Verify "Save order" button appears
  6. Click "Save order"
  7. Wait for page reload
  8. Verify order persisted: C, A, B
- **Expected:**
  - Links can be dragged
  - Visual order updates immediately
  - "Save order" button appears only when there are changes
  - Order persists after save

### Test: Save order button only appears when order changed

- **Preconditions:**
  - User authenticated with 2 links
- **Steps:**
  1. Navigate to `/dashboard`
  2. Verify "Save order" button is NOT visible
  3. Drag a link and drop it in the same position
  4. Verify "Save order" button is still NOT visible
  5. Drag a link to a different position
  6. Verify "Save order" button IS visible
- **Expected:**
  - Button only appears when actual order change detected

### Test: Links remain draggable after adding a new link

- **Preconditions:**
  - User authenticated with 1 link
- **Steps:**
  1. Navigate to `/dashboard`
  2. Add a new link via dialog
  3. Wait for page to update (2 links now)
  4. Drag second link above first
  5. Verify "Save order" button appears
  6. Save order
- **Expected:**
  - New links integrate into sortable list correctly

### Test: Reorder error shows inline message and reverts order

- **Preconditions:**
  - User authenticated with 2 links
- **Steps:**
  1. Navigate to `/dashboard`
  2. Reorder links
  3. Intercept POST to return error
  4. Click "Save order"
- **Expected:**
  - Error message appears in red box
  - Visual order reverts to original
  - "Save order" button disappears

### Test: Cannot add more than 5 links (existing test - verify still passes)

- **Preconditions:** User with 5 links
- **Steps:** Navigate to `/dashboard`
- **Expected:** "Add Link" button is disabled, counter shows (5/5)

---

## 6. Dependencies & Installation

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## 7. Notes

- El test de reorder con error de red requiere interceptar la request de Playwright - esto puede ser complejo, considerar mock del action si es necesario.
- El icono DragHandleIcon usa un SVG estándar de "6 puntos" (grip vertical).
- `touch-none` en el drag handle es importante para evitar scroll en móvil mientras se arrastra.
- `activationConstraint: { distance: 8 }` evita drags accidentales al hacer clic.
