import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe, CheckCircle, Plus, Edit, Trash2 } from "lucide-react"
import { FileUploadModal } from "@/components/FileUploadModal"
import EntityEditDialog from '@/components/EntityEditDialog'
import catalogService from '@/lib/services/catalogService'
import { isNonEmptyString } from '@/lib/validation'
import { useState, useEffect } from "react"
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'

interface LocalizedTrack {
  trackTitle: string
  sr?: number
  languages: Record<string, string> // key: language name (lowercase id), value: status
  originalOrder?: number
}

const baseSeed = [
  "GitHub Copilot Innovation Workshop",
  "Build Intelligent Apps with Microsoft's Copilot Stack & Azure OpenAI",
  "Get Started with OpenAI and Build Natural Language Solution",
  "Cloud Native Applications",
  "Use Azure OpenAI Like A Pro to Build Powerful AI Applications",
  "Intelligent App Development with Microsoft Copilot Stack",
  "GitHub Copilot – Hackathon",
  "Introduction To Building AI Apps",
  "Activate GenAI with Azure",
  "Low-Code for Pro-Dev in a Day"
];
const initialLocalizedTracksData: LocalizedTrack[] = baseSeed.map(title => ({ trackTitle: title, languages: { spanish: 'Available', portuguese: 'Available' } }));

const getAvailabilityBadge = (status: string) => {
  if (status === "Available") {
    return (
      <Badge variant="default" className="bg-green-500 hover:bg-green-600 flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Available
      </Badge>
    )
  }
  return <Badge variant="secondary">{status}</Badge>
}

export default function LocalizedTracksPage() {
  const { userRole: role } = useAuth()
  const [localizedTracksData, setLocalizedTracksData] = useState<LocalizedTrack[]>(initialLocalizedTracksData)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editFormData, setEditFormData] = useState<LocalizedTrack>({ trackTitle: "", languages: { spanish: '', portuguese: '' } })
  // Removed inline per-track language addition; languages beyond spanish/portuguese are added globally
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await api.get('/api/catalog')
        if (!mounted) return
        const items = Array.isArray(res.data) ? res.data : []
        const localized = items.filter((i: any) => i.type === 'localizedTrack')
        if (localized.length > 0) {
          // Detect dynamic languages from keys other than trackTitle, sr, id, type
          const mapped: LocalizedTrack[] = localized.map((i: any) => {
            const langEntries: Record<string,string> = {}
            Object.keys(i).forEach(k => {
              if (!['trackTitle','title','sr','id','type'].includes(k)) {
                const val = i[k]
                if (typeof val === 'string') langEntries[k.toLowerCase()] = val || 'Not Available'
              }
            })
            if (!langEntries['spanish'] && i.spanish) langEntries['spanish'] = i.spanish
            if (!langEntries['portuguese'] && i.portuguese) langEntries['portuguese'] = i.portuguese
            return {
              sr: Number(i.sr || i.id || 0),
              trackTitle: i.trackTitle || i.title || '',
              languages: langEntries
            }
          })
          setLocalizedTracksData(mapped)
        }
      } catch (err) {
        // ignore load errors for now
      }
    })()
    return () => { mounted = false }
  }, [])

  const handleEdit = (index: number) => {
    setEditingIndex(index)
    setEditFormData(localizedTracksData[index])
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (editingIndex !== null) {
      if (!isNonEmptyString(editFormData.trackTitle, 3)) {
        toast({ title: 'Validation', description: 'Track title is required (min 3 chars)', variant: 'destructive' })
        return
      }
      setSaving(true)
      ;(async () => {
        try {
          // Flatten languages into payload keys
          const langPayload: Record<string,string> = {}
          Object.entries(editFormData.languages).forEach(([k,v]) => { langPayload[k] = v })
          const payload = { trackTitle: editFormData.trackTitle, ...langPayload, type: 'localizedTrack' }
          if (editFormData.sr && editFormData.sr > 0) {
            await catalogService.update(editFormData.sr, payload)
          } else {
            const item = await catalogService.create(payload)
            if (item) editFormData.sr = Number(item.sr || item.id || 0)
          }
          const updatedData = [...localizedTracksData]
          updatedData[editingIndex] = { ...editFormData }
          setLocalizedTracksData(updatedData)
          setIsEditDialogOpen(false)
          setEditingIndex(null)
          setEditFormData({ trackTitle: "", languages: { spanish: '', portuguese: '' } })
          toast({ title: 'Saved', description: 'Localized track saved' })
        } catch (err) {
          toast({ title: 'Save failed', description: 'Could not save localized track', variant: 'destructive' })
        } finally { setSaving(false) }
      })()
    } else {
      // create new localized track
      if (!isNonEmptyString(editFormData.trackTitle, 3)) {
        toast({ title: 'Validation', description: 'Track title is required (min 3 chars)', variant: 'destructive' })
        return
      }
      setSaving(true)
      ;(async () => {
        try {
          const langPayload: Record<string,string> = {}
          Object.entries(editFormData.languages).forEach(([k,v]) => { langPayload[k] = v })
          const payload = { trackTitle: editFormData.trackTitle, ...langPayload, type: 'localizedTrack' }
          const item = await catalogService.create(payload)
          const newEntry = {
            sr: Number(item.sr || item.id || localizedTracksData.length + 1),
            trackTitle: item.trackTitle || item.title || editFormData.trackTitle,
            languages: { ...editFormData.languages }
          }
          const updated = [...localizedTracksData, newEntry].map((x, i) => ({ ...x, sr: i + 1 }))
          setLocalizedTracksData(updated)
          setIsEditDialogOpen(false)
          setEditingIndex(null)
          setEditFormData({ trackTitle: '', languages: { spanish: '', portuguese: '' } })
          toast({ title: 'Created', description: 'Localized track added' })
        } catch (err) {
          toast({ title: 'Save failed', description: 'Could not create localized track', variant: 'destructive' })
        } finally { setSaving(false) }
      })()
    }
  }

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false)
    setEditingIndex(null)
    setEditFormData({ trackTitle: "", languages: { spanish: '', portuguese: '' } })
  }

  const handleDelete = (index: number) => {
    if (window.confirm("Are you sure you want to delete this track?")) {
      const item = localizedTracksData[index]
      ;(async () => {
        try {
          if (item.sr) await catalogService.remove(item.sr)
          const updatedData = localizedTracksData.filter((_, i) => i !== index)
          setLocalizedTracksData(updatedData)
          toast({ title: 'Deleted', description: 'Localized track removed' })
        } catch (err) {
          toast({ title: 'Delete failed', description: 'Could not delete localized track', variant: 'destructive' })
        }
      })()
    }
  }

  const handleAddGlobalLanguage = () => {
    if (role !== 'admin') return
    const name = window.prompt('Enter new language name (e.g., Chinese):')
    if (!name) return
    const key = name.trim().toLowerCase()
    if (!key) return
    // Check if language already exists in any track
    const existing = localizedTracksData.some(t => Object.prototype.hasOwnProperty.call(t.languages, key))
    if (existing) {
      toast({ title: 'Language Exists', description: `${name} already present`, variant: 'default' })
      return
    }
    setSaving(true)
    ;(async () => {
      try {
        const updatedTracks: LocalizedTrack[] = []
        for (const t of localizedTracksData) {
          const newLangs = { ...t.languages, [key]: 'Not Available' }
            // Persist update if record already stored
          if (t.sr) {
            try {
              await catalogService.update(t.sr, { trackTitle: t.trackTitle, ...newLangs, type: 'localizedTrack' })
            } catch (e) {
              // ignore individual failure; we still update local state
            }
          }
          updatedTracks.push({ ...t, languages: newLangs })
        }
        setLocalizedTracksData(updatedTracks)
        toast({ title: 'Language Added', description: `${name} added globally with default Not Available` })
      } finally {
        setSaving(false)
      }
    })()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between">
          <div></div>
          <div className="flex items-center gap-2">
            {role === 'admin' && (
              <>
                <Button size="sm" className="flex items-center gap-2" onClick={() => { setEditingIndex(null); setEditFormData({ trackTitle: '', languages: { spanish: '', portuguese: '' } }); setIsEditDialogOpen(true) }}>
                  <Plus className="h-4 w-4" />
                  Add Track
                </Button>
                <Button size="sm" variant="outline" className="flex items-center gap-2" onClick={handleAddGlobalLanguage} disabled={saving}>
                  <Globe className="h-4 w-4" />
                  Add Language
                </Button>
              </>
            )}
          </div>
        </div>
  {/* Add Track button handled below in body to keep layout consistent */}
        {/* Edit Dialog */}
        <EntityEditDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} title={editingIndex !== null ? `Edit: ${localizedTracksData[editingIndex]?.trackTitle || ''}` : 'Edit Localized Track'} saving={saving} onSave={async () => { handleSaveEdit() }}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="trackTitle" className="text-right">Track Title</Label>
              <Input id="trackTitle" value={editFormData.trackTitle} onChange={(e) => setEditFormData({ ...editFormData, trackTitle: e.target.value })} className="col-span-3" />
            </div>
            {/* Fixed editable languages: Spanish & Portuguese */}
            {['spanish','portuguese'].map(langKey => (
              <div className="grid grid-cols-4 items-center gap-4" key={langKey}>
                <Label className="text-right capitalize">{langKey}</Label>
                <Select value={editFormData.languages[langKey] || 'Not Available'} onValueChange={(value) => setEditFormData(prev => ({ ...prev, languages: { ...prev.languages, [langKey]: value } }))}>
                  <SelectTrigger className="col-span-3"><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Not Available">Not Available</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
            {/* Any additional languages are displayed read-only inside table; not editable here */}
          </div>
        </EntityEditDialog>

  <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Localization Status
            </CardTitle>
            <CardDescription>
              Tracks with core Spanish & Portuguese statuses. Additional languages (added via Add Language) appear read-only and default to Not Available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ScrollArea className="h-[600px] w-full rounded-md border">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="min-w-[300px]">Track Title</TableHead>
                      {/** Dynamically render language columns discovered in dataset */}
                      {Array.from(new Set(localizedTracksData.flatMap(t => Object.keys(t.languages)))).map(lang => (
                        <TableHead key={lang} className="w-28 text-center capitalize">{lang}</TableHead>
                      ))}
                      <TableHead className="w-32 text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {localizedTracksData.map((track, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{track.trackTitle}</TableCell>
                        {Array.from(new Set(localizedTracksData.flatMap(t => Object.keys(t.languages)))).map(lang => (
                          <TableCell key={lang} className="text-center">{getAvailabilityBadge(track.languages[lang] || 'Not Available')}</TableCell>
                        ))}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                              {role === 'admin' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(index)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(index)}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        
      </div>
    </DashboardLayout>
  )
}