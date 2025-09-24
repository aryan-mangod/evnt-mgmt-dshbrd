import { DashboardLayout } from "@/components/DashboardLayout"
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Plus, X, ChevronLeft, ChevronRight, Trash2, Eye } from "lucide-react"
import { FileUploadModal } from "@/components/FileUploadModal"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
// Simplified: upload-only screen for feedback screenshots

export default function ParticipantFeedbackPage() {
  const role = typeof window !== 'undefined' ? localStorage.getItem('dashboard_role') : null
  const [items, setItems] = useState<any[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Filter only image items and get latest 6
  const imageItems = items
    .filter(item => String(item.mime || '').startsWith('image/'))
    .slice(0, 6)

  useEffect(() => {
    ;(async () => {
      try {
        const base = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:4000'
        const res = await fetch(`${base}/api/data`)
        const data = await res.json()
        const reviews = Array.isArray(data.reviews) ? data.reviews : []
        setItems(reviews)
      } catch (e) { }
    })()
    const onChanged = (e: any) => {
      if (e && e.detail) setItems(e.detail)
    }
    window.addEventListener('reviews:changed', onChanged as EventListener)
    return () => window.removeEventListener('reviews:changed', onChanged as EventListener)
  }, [])

  const openModal = (imagePath: string, index: number) => {
    setSelectedImage(imagePath)
    setSelectedIndex(index)
    setIsModalOpen(true)
  }

  const navigateImage = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? (selectedIndex - 1 + imageItems.length) % imageItems.length
      : (selectedIndex + 1) % imageItems.length
    
    setSelectedIndex(newIndex)
    setSelectedImage(`${(import.meta as any).env?.VITE_API_BASE || 'http://localhost:4000'}${imageItems[newIndex].path}`)
  }

  const handleDelete = async (itemId: string, itemName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${itemName}"?`)) {
      return
    }

    try {
      const base = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:4000'
      const token = localStorage.getItem('dashboard_token')
      
      const response = await fetch(`${base}/api/reviews/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // Remove item from local state
        setItems(prev => prev.filter(item => item.id !== itemId))
        toast({
          title: "Success",
          description: "Feedback photo deleted successfully"
        })
        
        // Close modal if deleted item was being viewed
        if (isModalOpen && imageItems[selectedIndex]?.id === itemId) {
          setIsModalOpen(false)
        }
      } else {
        throw new Error('Failed to delete')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete feedback photo",
        variant: "destructive"
      })
    }
  }
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Feedback Gallery</h1>
            <p className="text-muted-foreground">Latest 6 feedback photos from participants</p>
          </div>
          {role === 'admin' && (
            <FileUploadModal
              trigger={
                <Button size="sm" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Upload Photo
                </Button>
              }
              accept=".png,.jpg,.jpeg"
              uploadTo="/api/upload-review"
            />
          )}
        </div>

        {/* Gallery Grid - 2 rows x 3 columns */}
        <div className="grid grid-cols-3 gap-4 max-w-4xl">
          {imageItems.map((item, index) => (
            <div 
              key={item.id} 
              className="relative group cursor-pointer aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
            >
                <img 
                src={`${(import.meta as any).env?.VITE_API_BASE || 'http://localhost:4000'}${item.path}`} 
                alt={item.eventName || `Feedback ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                onClick={() => openModal(`${(import.meta as any).env?.VITE_API_BASE || 'http://localhost:4000'}${item.path}`, index)}
              />              {/* Hover overlay with enhanced visibility */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
              
              {/* Action buttons for admin */}
              {role === 'admin' && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 bg-white/20 hover:bg-white/40 backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      openModal(`${(import.meta as any).env?.VITE_API_BASE || 'http://localhost:4000'}${item.path}`, index)
                    }}
                  >
                    <Eye className="h-4 w-4 text-white" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8 bg-red-500/80 hover:bg-red-600/90 backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(item.id, item.eventName || `Feedback ${index + 1}`)
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-white" />
                  </Button>
                </div>
              )}
              
              {/* Enhanced bottom info bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-white text-sm font-medium truncate mb-1">
                  {item.eventName || `Feedback ${index + 1}`}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-white/80 text-xs">Click to view full size</span>
                  {role !== 'admin' && (
                    <Eye className="h-4 w-4 text-white/60" />
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Empty placeholders if less than 6 images - only show for admin */}
          {role === 'admin' && Array.from({ length: Math.max(0, 6 - imageItems.length) }).map((_, index) => (
            <div 
              key={`empty-${index}`}
              className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 transition-colors duration-200"
            >
              <div className="text-center text-gray-400 dark:text-gray-500">
                <Plus className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Upload feedback</p>
              </div>
            </div>
          ))}
        </div>

        {imageItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <Plus className="h-16 w-16 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No feedback photos yet</h3>
              <p className="text-sm">Upload participant feedback screenshots to create your gallery</p>
            </div>
          </div>
        )}

        {/* Enhanced Image Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-5xl max-h-[95vh] p-0 bg-black/95">
            <DialogHeader className="p-4 pb-2 bg-black/50 backdrop-blur-sm">
              <DialogTitle className="flex items-center justify-between text-white">
                <span>Feedback Gallery</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-300">
                    {selectedIndex + 1} of {imageItems.length}
                  </span>
                  {role === 'admin' && selectedImage && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="bg-red-600/80 hover:bg-red-700/90"
                      onClick={() => {
                        const currentItem = imageItems[selectedIndex]
                        if (currentItem) {
                          handleDelete(currentItem.id, currentItem.eventName || `Feedback ${selectedIndex + 1}`)
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  )}
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="relative flex-1 p-4">
              {selectedImage && (
                <div className="flex items-center justify-center h-full">
                  <img 
                    src={selectedImage} 
                    alt={`Feedback ${selectedIndex + 1}`}
                    className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                  />
                </div>
              )}
              
              {/* Enhanced Navigation buttons */}
              {imageItems.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm h-12 w-12"
                    onClick={() => navigateImage('prev')}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm h-12 w-12"
                    onClick={() => navigateImage('next')}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}
              
              {/* Image info */}
              {imageItems[selectedIndex] && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-white font-medium">
                    {imageItems[selectedIndex].eventName || `Feedback ${selectedIndex + 1}`}
                  </p>
                  <p className="text-gray-300 text-sm mt-1">
                    Click and drag to pan • Use arrow buttons to navigate
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}