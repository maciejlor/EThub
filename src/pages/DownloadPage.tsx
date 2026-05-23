import { useState, useEffect, useMemo, useRef } from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page } from '@/components/Page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DownloadIcon,
  UploadIcon,
  TrashIcon,
  SearchIcon,
  FileIcon,
  FileTextIcon,
  FileArchiveIcon,
  FileCodeIcon,
  InfoIcon,
  AlertTriangleIcon,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getDownloads,
  addDownload,
  removeDownload,
  subscribeDownloadsChanges,
  getCurrentUser,
  type DownloadFile,
} from '@/lib/driver-storage';
import { useToast } from '@/lib/toast';

const CATEGORY_COLORS = {
  Resource: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Mod: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Document: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Other: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const CATEGORY_ICONS = {
  Resource: FileTextIcon,
  Mod: FileCodeIcon,
  Document: FileIcon,
  Other: FileArchiveIcon,
};

export function DownloadPage() {
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'Admin';
  const { success, error: toastError, warning: toastWarning } = useToast();

  const [downloads, setDownloads] = useState<DownloadFile[]>(getDownloads());
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'Resource' | 'Mod' | 'Document' | 'Other'>('Resource');
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = subscribeDownloadsChanges(() => {
      setDownloads(getDownloads());
    });
    return unsub;
  }, []);

  const filteredDownloads = useMemo(() => {
    return downloads.filter((dl) => {
      const matchSearch =
        dl.name.toLowerCase().includes(search.toLowerCase()) ||
        dl.description.toLowerCase().includes(search.toLowerCase()) ||
        dl.uploadedBy.toLowerCase().includes(search.toLowerCase());
      const matchCategory = selectedCategory === 'all' || dl.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [downloads, search, selectedCategory]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Limit to 10MB
    if (selected.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds the 10MB limit. Please upload a smaller file.');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      // Warn for large files that may exceed localStorage capacity
      const localStorageWarnThreshold = 4.5 * 1024 * 1024; // ~4.5MB
      if (selected.size > localStorageWarnThreshold) {
        toastWarning(
          'Large File',
          'Files larger than ~4.5 MB may not persist due to browser storage limits.'
        );
      }
      setUploadError(null);
      setFile(selected);
      if (!title) {
        // Pre-fill title from filename without extension
        const baseName = selected.name.substring(0, selected.name.lastIndexOf('.')) || selected.name;
        setTitle(baseName);
      }
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) return;

    const reader = new FileReader();
    reader.onerror = () => {
      toastError('Upload Failed', 'Could not read the selected file. Please try a different file.');
      setUploadError('Could not read the selected file.');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onload = () => {
      try {
        const dataUrl = reader.result as string;
        addDownload({
          name: file.name,
          size: file.size,
          description: '',
          category,
          dataUrl,
        });

        // Reset form
        setTitle('');
        setCategory('Resource');
        setFile(null);
        setUploadError(null);
        success('File Uploaded', `"${file.name}" was added to the registry.`);

        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err: any) {
        const name = err && err.name ? err.name : '';
        const message = err && err.message ? err.message : String(err);
        const isQuota = /quota|exceed/i.test(name) || /quota|exceed/i.test(message) || err?.code === 22;
        if (isQuota) {
          toastError(
            'Upload Failed',
            'File is too large to store in your browser. Try a smaller file or host it externally.'
          );
          setUploadError('File could not be saved due to browser storage limits.');
        } else {
          toastError('Upload Failed', 'Could not read the selected file. Please try a different file.');
        }
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmTarget({ id, name });
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!confirmTarget) return;
    removeDownload(confirmTarget.id);
    success('File Deleted', `"${confirmTarget.name}" was removed from the registry.`);
    setConfirmOpen(false);
    setConfirmTarget(null);
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
    setConfirmTarget(null);
  };

  const handleDownloadFile = (dl: DownloadFile) => {
    const link = document.createElement('a');
    link.href = dl.dataUrl;
    link.download = dl.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#0b0b0b]">
        <Header />
        <main className="bg-[#0b0b0b]">
          <Page>
            {/* Header */}
            <div className="flex flex-col gap-2 mb-8">
              <h1 className="text-2xl font-bold text-white tracking-tight lg:text-3xl">
                Downloads Center
              </h1>
              <p className="text-sm text-zinc-400">
                Access VTC resources, client saves, skin mods, and profile configurations.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1fr_360px] items-start">
              {/* File List Panel */}
              <div className="space-y-6">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      id="search-downloads"
                      placeholder="Search files by name or category…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 bg-[#111111] border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-700"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-44 bg-[#111111] border-zinc-800 text-white">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#121212] border-zinc-800 text-white">
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Resource">Resources</SelectItem>
                      <SelectItem value="Mod">Mods</SelectItem>
                      <SelectItem value="Document">Documents</SelectItem>
                      <SelectItem value="Other">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Items Grid */}
                {filteredDownloads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-zinc-800 bg-[#0f0f0f]/40">
                    <FileIcon className="h-12 w-12 text-zinc-600 mb-4 opacity-40" />
                    <h3 className="text-lg font-medium text-white mb-1">No files found</h3>
                    <p className="text-sm text-zinc-500">
                      {downloads.length === 0
                        ? 'No files have been uploaded to the registry yet.'
                        : 'No files match your search criteria.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                    {filteredDownloads.map((dl) => {
                      const IconComponent = CATEGORY_ICONS[dl.category] || FileIcon;
                      return (
                        <Card
                          key={dl.id}
                          className="bg-[#111111] border-zinc-800/80 hover:border-zinc-700/80 transition-all duration-300 flex flex-col justify-between"
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <Badge className={`${CATEGORY_COLORS[dl.category]} text-xs font-semibold px-2 py-0.5 border`}>
                                <IconComponent className="h-3.5 w-3.5 mr-1" />
                                {dl.category}
                              </Badge>
                              <span className="text-[11px] font-mono text-zinc-500">
                                {dl.formattedSize}
                              </span>
                            </div>
                            <CardTitle className="text-base font-bold text-white line-clamp-1">
                              {dl.name}
                            </CardTitle>
                            {/* description removed */}
                          </CardHeader>
                          <CardContent className="pt-0 pb-4 flex flex-col gap-3">
                            <div className="border-t border-zinc-800/60 my-1" />
                            <div className="flex justify-between items-center text-[10px] text-zinc-500">
                              <span>Uploaded by: <strong className="text-zinc-400">{dl.uploadedBy}</strong></span>
                              <span>{new Date(dl.uploadedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex gap-2 mt-1">
                              <Button
                                onClick={() => handleDownloadFile(dl)}
                                className="flex-1 bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all"
                              >
                                <DownloadIcon className="h-3.5 w-3.5 mr-1.5" />
                                Download
                              </Button>
                              {isAdmin && (
                                <Button
                                  variant="destructive"
                                  onClick={() => handleDelete(dl.id, dl.name)}
                                  className="px-3 bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-950/50 hover:text-red-300 hover:border-red-500/40"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Upload Card for Admins */}
              <div>
                {isAdmin ? (
                  <Card className="bg-[#111111] border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                        <UploadIcon className="h-5 w-5 text-emerald-400" />
                        Upload Registry File
                      </CardTitle>
                      <CardDescription className="text-xs text-zinc-500">
                        Add rule books, telemetry profiles, client saves or skins.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleUploadSubmit} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                            Select File <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            required
                            accept=".zip,.rar,.7z,.vtc"
                            className="hidden"
                            id="upload-file-input"
                          />
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border border-dashed border-zinc-800 hover:border-zinc-700 bg-[#0f0f0f] rounded-lg p-5 text-center cursor-pointer transition-colors"
                          >
                            <UploadIcon className="mx-auto h-6 w-6 text-zinc-500 mb-2" />
                            <span className="text-xs font-medium text-zinc-300 block truncate">
                              {file ? file.name : 'Click to select file'}
                            </span>
                            {/* upload hints removed per request */}
                          </div>
                        </div>

                        {uploadError && (
                          <div className="flex gap-2 items-start p-3 rounded-lg bg-red-950/20 border border-red-500/20 text-xs text-red-400 leading-relaxed">
                            <AlertTriangleIcon className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>{uploadError}</span>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                            Download Title
                          </label>
                          <Input
                            placeholder="e.g. VTC Save profile"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="bg-[#0f0f0f] border-zinc-800 text-white text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                            Category
                          </label>
                          <Select
                            value={category}
                            onValueChange={(val: any) => setCategory(val)}
                          >
                            <SelectTrigger className="bg-[#0f0f0f] border-zinc-800 text-white text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#121212] border-zinc-800 text-white text-xs">
                              <SelectItem value="Resource">Resource</SelectItem>
                              <SelectItem value="Mod">Mod</SelectItem>
                              <SelectItem value="Document">Document</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* description removed per request */}

                        <Button
                          type="submit"
                          disabled={!file || !title.trim()}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-lg transition-all"
                        >
                          <UploadIcon className="h-4 w-4 mr-2" />
                          Upload & Sync File
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-[#111111] border-zinc-850">
                    <CardHeader className="pb-3">
                      <div className="w-10 h-10 bg-zinc-800/40 rounded-full flex items-center justify-center mb-2">
                        <InfoIcon className="h-5 w-5 text-zinc-400" />
                      </div>
                      <CardTitle className="text-sm font-bold text-white">
                        About Downloads
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-zinc-400 leading-relaxed space-y-2">
                      <p>
                        This downloads catalog is synchronized automatically across your active browser sessions.
                      </p>
                      <p>
                        Drivers and staff can download any file from the panel on the left, but only VTC Administrators are authorized to upload or delete assets.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </Page>
        </main>
      </SidebarInset>
      <Dialog open={confirmOpen} onOpenChange={(open) => { if (!open) cancelDelete(); setConfirmOpen(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{confirmTarget?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
