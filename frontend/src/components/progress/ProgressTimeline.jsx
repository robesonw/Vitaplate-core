import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smile, Zap } from 'lucide-react';
import { format } from 'date-fns';

const energyEmojis = ['😴', '😒', '😐', '😊', '🔥'];
const moodEmojis = ['😢', '😕', '😐', '🙂', '😄'];

export default function ProgressTimeline({ entries = [] }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  const sortedEntries = [...entries].sort((a, b) => 
    new Date(b.entry_date) - new Date(a.entry_date)
  );

  const getMeasurementChange = (currentEntry, previousEntry) => {
    if (!previousEntry) return null;
    
    const changes = {};
    if (currentEntry.weight && previousEntry.weight) {
      const diff = currentEntry.weight - previousEntry.weight;
      changes.weight = {
        value: diff,
        unit: currentEntry.weight_unit,
        isLoss: diff < 0
      };
    }
    
    return Object.keys(changes).length > 0 ? changes : null;
  };

  const getWeightLossText = (change) => {
    if (!change?.weight) return null;
    const amount = Math.abs(change.weight.value).toFixed(1);
    const direction = change.weight.isLoss ? 'Lost' : 'Gained';
    return `${direction} ${amount}${change.weight.unit}`;
  };

  return (
    <div className="space-y-4">
      {sortedEntries.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="p-12 text-center">
            <Smile className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">No progress entries yet. Start by logging your first entry!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedEntries.map((entry, idx) => {
            const previousEntry = sortedEntries[idx + 1];
            const change = getMeasurementChange(entry, previousEntry);
            const weightLossText = getWeightLossText(change);

            return (
              <Card key={entry.id} className="border-slate-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="grid md:grid-cols-4 gap-4">
                    {/* Photo */}
                    {entry.photo_url && (
                      <div className="md:col-span-1">
                        <img
                          src={entry.photo_url}
                          alt="Progress"
                          className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            setSelectedPhoto(entry);
                            setPhotoIndex(0);
                          }}
                        />
                      </div>
                    )}

                    {/* Data */}
                    <div className={entry.photo_url ? 'md:col-span-3' : 'md:col-span-4'}>
                      {/* Date & Change */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {format(new Date(entry.entry_date), 'MMM d, yyyy')}
                          </p>
                          {weightLossText && (
                            <p className={`text-sm font-medium ${change.weight.isLoss ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {weightLossText}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {entry.energy_level && (
                            <Badge variant="secondary" title="Energy level">
                              <Zap className="w-3 h-3 mr-1" />
                              {energyEmojis[entry.energy_level - 1]}
                            </Badge>
                          )}
                          {entry.mood && (
                            <Badge variant="secondary" title="Mood">
                              <Smile className="w-3 h-3 mr-1" />
                              {moodEmojis[entry.mood - 1]}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                        {entry.weight && (
                          <div className="bg-slate-50 p-2 rounded text-sm">
                            <p className="text-slate-600 text-xs">Weight</p>
                            <p className="font-semibold text-slate-900">
                              {entry.weight} {entry.weight_unit}
                            </p>
                          </div>
                        )}
                        {entry.body_fat_percentage && (
                          <div className="bg-slate-50 p-2 rounded text-sm">
                            <p className="text-slate-600 text-xs">Body Fat</p>
                            <p className="font-semibold text-slate-900">{entry.body_fat_percentage}%</p>
                          </div>
                        )}
                        {entry.waist_cm && (
                          <div className="bg-slate-50 p-2 rounded text-sm">
                            <p className="text-slate-600 text-xs">Waist</p>
                            <p className="font-semibold text-slate-900">{entry.waist_cm}cm</p>
                          </div>
                        )}
                        {entry.hip_cm && (
                          <div className="bg-slate-50 p-2 rounded text-sm">
                            <p className="text-slate-600 text-xs">Hip</p>
                            <p className="font-semibold text-slate-900">{entry.hip_cm}cm</p>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {entry.notes && (
                        <p className="text-sm text-slate-700 italic border-l-2 border-emerald-300 pl-3">
                          "{entry.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <Card className="max-w-2xl w-full">
            <CardContent className="p-0">
              <img
                src={selectedPhoto.photo_url}
                alt="Progress detail"
                className="w-full max-h-[70vh] object-cover rounded-lg"
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}