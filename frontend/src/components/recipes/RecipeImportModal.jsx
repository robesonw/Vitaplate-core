import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { base44 } from '@/api/base44Client';
import { Loader2, Link2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function RecipeImportModal({ isOpen, onOpenChange, onRecipeImported }) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImport = async () => {
    if (!url.trim()) {
      setError('Please enter a recipe URL');
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await base44.functions.invoke('importRecipeFromUrl', {
        url: url.trim()
      });

      if (response.data.error) {
        setError(response.data.error);
        return;
      }

      toast.success('Recipe imported successfully!');
      onRecipeImported(response.data.recipe);
      setUrl('');
      onOpenChange(false);
    } catch (err) {
      setError('Failed to import recipe. Please try again or copy manually.');
      console.error('Import error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleImport();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-indigo-600" />
            Import Recipe from URL
          </DialogTitle>
          <DialogDescription>
            Paste a recipe URL from any website and we'll extract the details automatically
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* URL Input */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Recipe URL
            </label>
            <Input
              placeholder="https://www.allrecipes.com/recipe/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="bg-slate-50"
            />
          </div>

          {/* Supported Sites */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs font-medium text-blue-900 mb-2">Works with:</p>
            <p className="text-xs text-blue-800">
              AllRecipes, NYT Cooking, Food Network, Bon Appétit, Serious Eats, and most recipe websites
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={isLoading || !url.trim()}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                'Import Recipe'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}