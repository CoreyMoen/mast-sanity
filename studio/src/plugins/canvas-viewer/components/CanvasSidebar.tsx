import {useState, useCallback, useRef, useEffect} from 'react'
import {Card, Stack, Flex, Text, Button, TextInput, Box} from '@sanity/ui'
import {AddIcon, TrashIcon, EditIcon, ChevronUpIcon, ChevronDownIcon} from '@sanity/icons'
import type {CanvasDocument} from '../types'

interface CanvasSidebarProps {
  canvases: CanvasDocument[]
  activeCanvasId: string | null
  onSelect: (id: string) => void
  onCreate: (name: string) => Promise<string>
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
  onMove: (id: string, direction: 'up' | 'down') => void
}

export function CanvasSidebar({
  canvases,
  activeCanvasId,
  onSelect,
  onCreate,
  onDelete,
  onRename,
  onMove,
}: CanvasSidebarProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const createInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isCreating && createInputRef.current) {
      createInputRef.current.focus()
    }
  }, [isCreating])

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  const handleCreate = useCallback(async () => {
    const name = newName.trim()
    if (!name) return
    const id = await onCreate(name)
    setNewName('')
    setIsCreating(false)
    onSelect(id)
  }, [newName, onCreate, onSelect])

  const handleCreateKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleCreate()
      if (e.key === 'Escape') {
        setIsCreating(false)
        setNewName('')
      }
    },
    [handleCreate],
  )

  const handleRenameSubmit = useCallback(
    (id: string) => {
      const name = editName.trim()
      if (name) onRename(id, name)
      setEditingId(null)
      setEditName('')
    },
    [editName, onRename],
  )

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent, id: string) => {
      if (e.key === 'Enter') handleRenameSubmit(id)
      if (e.key === 'Escape') {
        setEditingId(null)
        setEditName('')
      }
    },
    [handleRenameSubmit],
  )

  const startEditing = useCallback((canvas: CanvasDocument) => {
    setEditingId(canvas._id)
    setEditName(canvas.name)
  }, [])

  const handleDelete = useCallback(
    (id: string, name: string) => {
      if (window.confirm(`Delete canvas "${name}"? This cannot be undone.`)) {
        onDelete(id)
      }
    },
    [onDelete],
  )

  return (
    <Card
      borderRight
      style={{
        width: 240,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Header */}
      <Card padding={3} borderBottom style={{flexShrink: 0}}>
        <Flex align="center" justify="space-between">
          <Text size={1} weight="semibold">
            Canvases
          </Text>
          <Button
            icon={AddIcon}
            mode="bleed"
            fontSize={1}
            onClick={() => setIsCreating(true)}
            title="New canvas"
          />
        </Flex>
      </Card>

      {/* Canvas list */}
      <Box style={{flex: 1, overflowY: 'auto'}}>
        <Stack padding={2} space={1}>
          {canvases.map((canvas, index) => (
            <Card
              key={canvas._id}
              padding={2}
              radius={2}
              tone={activeCanvasId === canvas._id ? 'primary' : 'default'}
              pressed={activeCanvasId === canvas._id}
              style={{cursor: 'pointer'}}
              onClick={() => {
                if (editingId !== canvas._id) onSelect(canvas._id)
              }}
            >
              {editingId === canvas._id ? (
                <TextInput
                  ref={editInputRef}
                  value={editName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditName(e.currentTarget.value)
                  }
                  onKeyDown={(e: React.KeyboardEvent) => handleRenameKeyDown(e, canvas._id)}
                  onBlur={() => handleRenameSubmit(canvas._id)}
                  fontSize={1}
                />
              ) : (
                <Flex align="center" justify="space-between" gap={1}>
                  <Stack space={2} style={{flex: 1, minWidth: 0}}>
                    <Text
                      size={1}
                      weight={activeCanvasId === canvas._id ? 'semibold' : 'regular'}
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {canvas.name}
                    </Text>
                    <Text size={0} muted>
                      {canvas.pageCount} {canvas.pageCount === 1 ? 'page' : 'pages'}
                    </Text>
                  </Stack>

                  {/* Action buttons — visible on hover via CSS */}
                  <Flex
                    gap={0}
                    className="canvas-item-actions"
                    style={{opacity: 0, transition: 'opacity 0.15s'}}
                  >
                    <Button
                      icon={EditIcon}
                      mode="bleed"
                      fontSize={0}
                      padding={1}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation()
                        startEditing(canvas)
                      }}
                      title="Rename"
                    />
                    {index > 0 && (
                      <Button
                        icon={ChevronUpIcon}
                        mode="bleed"
                        fontSize={0}
                        padding={1}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation()
                          onMove(canvas._id, 'up')
                        }}
                        title="Move up"
                      />
                    )}
                    {index < canvases.length - 1 && (
                      <Button
                        icon={ChevronDownIcon}
                        mode="bleed"
                        fontSize={0}
                        padding={1}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation()
                          onMove(canvas._id, 'down')
                        }}
                        title="Move down"
                      />
                    )}
                    <Button
                      icon={TrashIcon}
                      mode="bleed"
                      fontSize={0}
                      padding={1}
                      tone="critical"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation()
                        handleDelete(canvas._id, canvas.name)
                      }}
                      title="Delete"
                    />
                  </Flex>
                </Flex>
              )}
            </Card>
          ))}

          {/* New canvas input */}
          {isCreating && (
            <Card padding={2}>
              <TextInput
                ref={createInputRef}
                value={newName}
                placeholder="Canvas name..."
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewName(e.currentTarget.value)
                }
                onKeyDown={handleCreateKeyDown}
                onBlur={() => {
                  if (!newName.trim()) {
                    setIsCreating(false)
                  }
                }}
                fontSize={1}
              />
            </Card>
          )}
        </Stack>

        {/* Empty state */}
        {canvases.length === 0 && !isCreating && (
          <Box padding={3}>
            <Stack space={3} style={{textAlign: 'center'}}>
              <Text size={1} muted>
                No canvases yet
              </Text>
              <Button
                text="Create your first canvas"
                mode="ghost"
                fontSize={1}
                onClick={() => setIsCreating(true)}
              />
            </Stack>
          </Box>
        )}
      </Box>
    </Card>
  )
}
